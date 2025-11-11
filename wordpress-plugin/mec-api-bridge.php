<?php
/**
 * Plugin Name: MEC API Bridge
 * Description: Integrates with MEC Event API addon to send data to external webhooks
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class MEC_API_Bridge {
    
    private $webhook_url;
    private $webhook_secret;
    private $api_key;
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        
        // Get settings
        $this->webhook_url = get_option('mec_api_webhook_url', '');
        $this->webhook_secret = get_option('mec_api_webhook_secret', '');
        $this->api_key = get_option('mec_api_key', '');
        
        // Always register REST API routes (no API key required for read access)
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        
        // Hook into MEC events for webhooks if API key is configured
        if (!empty($this->api_key)) {
            $this->init_mec_hooks();
        }
    }
    
    public function add_menu() {
        add_options_page(
            'MEC API Bridge',
            'MEC API Bridge',
            'manage_options',
            'mec-api-bridge',
            array($this, 'admin_page')
        );
    }
    
    public function register_settings() {
        register_setting('mec_api_settings', 'mec_api_webhook_url');
        register_setting('mec_api_settings', 'mec_api_webhook_secret');
        register_setting('mec_api_settings', 'mec_api_key');
        register_setting('mec_api_settings', 'mec_api_enabled');
    }
    
    private function init_mec_hooks() {
        // Event hooks
        add_action('save_post', array($this, 'on_event_saved'), 10, 2);
        add_action('transition_post_status', array($this, 'on_event_status_changed'), 10, 3);
        add_action('before_delete_post', array($this, 'on_event_deleted'), 10, 1);
        
        // Booking hooks (if MEC booking system is active)
        add_action('mec_booking_completed', array($this, 'on_booking_completed'), 10, 1);
        add_action('mec_booking_canceled', array($this, 'on_booking_canceled'), 10, 1);
    }
    
    public function register_rest_routes() {
        register_rest_route('mec-bridge/v1', '/events', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_events_with_metadata'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route('mec-bridge/v1', '/events/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_event_with_metadata'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route('mec-bridge/v1', '/bookings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_bookings_with_metadata'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route('mec-bridge/v1', '/events/(?P<id>\d+)/bookings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_event_bookings'),
            'permission_callback' => '__return_true',
        ));
    }
    
    public function get_events_with_metadata($request) {
        $per_page = $request->get_param('per_page') ? $request->get_param('per_page') : 100;
        $page = $request->get_param('page') ? $request->get_param('page') : 1;
        $start_date = $request->get_param('start_date');
        $end_date = $request->get_param('end_date');
        
        $args = array(
            'post_type' => 'mec-events',
            'post_status' => 'publish',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'ID',
            'order' => 'DESC',
            'nopaging' => false // Ensure pagination works
        );
        
        // Add date filtering using meta query if dates provided
        if ($start_date || $end_date) {
            $meta_query = array('relation' => 'AND');
            
            if ($start_date) {
                $meta_query[] = array(
                    'key' => 'mec_start_date',
                    'value' => $start_date,
                    'compare' => '>=',
                    'type' => 'DATE'
                );
            }
            
            if ($end_date) {
                $meta_query[] = array(
                    'key' => 'mec_start_date',
                    'value' => $end_date,
                    'compare' => '<=',
                    'type' => 'DATE'
                );
            }
            
            $args['meta_query'] = $meta_query;
        }
        
        $query = new WP_Query($args);
        $events = array();
        
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post_id = get_the_ID();
                
                $events[] = $this->format_event_data($post_id);
            }
            wp_reset_postdata();
        }
        
        return new WP_REST_Response($events, 200);
    }
    
    public function get_event_with_metadata($request) {
        $post_id = $request->get_param('id');
        
        if (!$post_id || get_post_type($post_id) !== 'mec-events') {
            return new WP_REST_Response(array('error' => 'Event not found'), 404);
        }
        
        $event_data = $this->format_event_data($post_id);
        return new WP_REST_Response($event_data, 200);
    }
    
    public function get_bookings_with_metadata($request) {
        global $wpdb;
        
        $per_page = $request->get_param('per_page') ? $request->get_param('per_page') : 100;
        $page = $request->get_param('page') ? $request->get_param('page') : 1;
        $event_id = $request->get_param('event_id');
        $offset = ($page - 1) * $per_page;
        
        // MEC stores bookings in a custom table
        $bookings_table = $wpdb->prefix . 'mec_bookings';
        $attendees_table = $wpdb->prefix . 'mec_attendees';
        
        // Check if bookings table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$bookings_table'") != $bookings_table) {
            // Return empty array instead of error - bookings addon may not be installed
            return new WP_REST_Response(array(), 200);
        }
        
        // Check if attendees table exists
        $has_attendees_table = ($wpdb->get_var("SHOW TABLES LIKE '$attendees_table'") == $attendees_table);
        
        // Build query with proper escaping
        if ($event_id) {
            $query = $wpdb->prepare(
                "SELECT * FROM $bookings_table WHERE event_id = %d ORDER BY id DESC LIMIT %d OFFSET %d",
                intval($event_id),
                intval($per_page),
                intval($offset)
            );
        } else {
            $query = $wpdb->prepare(
                "SELECT * FROM $bookings_table ORDER BY id DESC LIMIT %d OFFSET %d",
                intval($per_page),
                intval($offset)
            );
        }
        
        $bookings = $wpdb->get_results($query);
        
        $formatted_bookings = array();
        foreach ($bookings as $booking) {
            // Get attendees for this booking if attendees table exists
            $attendees = array();
            if ($has_attendees_table) {
                $attendees_query = $wpdb->prepare(
                    "SELECT * FROM $attendees_table WHERE booking_id = %d",
                    intval($booking->id)
                );
                $attendees = $wpdb->get_results($attendees_query);
            }
            
            // If no attendees found and booking has user_id, get user info from WordPress users table
            if (empty($attendees) && isset($booking->user_id) && !empty($booking->user_id)) {
                $user_query = $wpdb->prepare(
                    "SELECT ID, user_email, display_name FROM {$wpdb->users} WHERE ID = %d",
                    intval($booking->user_id)
                );
                $user = $wpdb->get_row($user_query);
                if ($user) {
                    // Get first_name and last_name from user meta
                    $first_name = get_user_meta($user->ID, 'first_name', true);
                    $last_name = get_user_meta($user->ID, 'last_name', true);
                    
                    // Convert user to attendee format
                    $attendees = array(array(
                        'id' => $user->ID,
                        'email' => $user->user_email,
                        'name' => $user->display_name,
                        'first_name' => $first_name,
                        'last_name' => $last_name
                    ));
                }
            }
            
            // Debug: Add user query info to debug output
            $debug_user_query = array(
                'user_id' => isset($booking->user_id) ? $booking->user_id : null,
                'user_found' => !empty($attendees),
                'attendees_count' => count($attendees)
            );
            
            $formatted_bookings[] = $this->format_booking_data($booking, $attendees, $debug_user_query);
        }
        
        return new WP_REST_Response($formatted_bookings, 200);
    }
    
    public function get_event_bookings($request) {
        global $wpdb;
        
        $event_id = $request->get_param('id');
        $per_page = $request->get_param('per_page') ? $request->get_param('per_page') : 100;
        $page = $request->get_param('page') ? $request->get_param('page') : 1;
        $offset = ($page - 1) * $per_page;
        
        $table_name = $wpdb->prefix . 'mec_bookings';
        
        // Check if table exists
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            // Return empty array instead of error - bookings addon may not be installed
            return new WP_REST_Response(array(), 200);
        }
        
        $query = $wpdb->prepare(
            "SELECT * FROM $table_name WHERE event_id = %d ORDER BY id DESC LIMIT %d OFFSET %d",
            intval($event_id),
            intval($per_page),
            intval($offset)
        );
        $bookings = $wpdb->get_results($query);
        
        $formatted_bookings = array();
        foreach ($bookings as $booking) {
            $formatted_bookings[] = $this->format_booking_data($booking, array(), array());
        }
        
        return new WP_REST_Response($formatted_bookings, 200);
    }
    
    private function format_booking_data($booking, $attendees = array(), $debug_user_query = array()) {
        // Decode attendees info if it's JSON - this is the primary source
        // MEC stores attendees_info as a JSON string in the booking record
        $attendees_info = array();
        if (isset($booking->attendees_info) && !empty($booking->attendees_info)) {
            // Try to decode as JSON
            $decoded = json_decode($booking->attendees_info, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $attendees_info = $decoded;
            } elseif (is_string($booking->attendees_info)) {
                // If it's a string but not valid JSON, try unserialize (some WordPress plugins use serialize)
                $unserialized = @unserialize($booking->attendees_info);
                if ($unserialized !== false && is_array($unserialized)) {
                    $attendees_info = $unserialized;
                }
            }
        }
        
        // Ensure attendees_info is an array
        if (!is_array($attendees_info)) {
            $attendees_info = array();
        }
        
        // Convert attendees from mec_attendees table to the same format
        $table_attendees = array();
        if (!empty($attendees)) {
            foreach ($attendees as $attendee) {
                $attendee_array = (array) $attendee;
                $table_attendees[] = array(
                    'name' => isset($attendee_array['name']) ? $attendee_array['name'] : 
                             (trim((isset($attendee_array['first_name']) ? $attendee_array['first_name'] : '') . ' ' . (isset($attendee_array['last_name']) ? $attendee_array['last_name'] : ''))),
                    'first_name' => isset($attendee_array['first_name']) ? $attendee_array['first_name'] : '',
                    'last_name' => isset($attendee_array['last_name']) ? $attendee_array['last_name'] : '',
                    'email' => isset($attendee_array['email']) ? $attendee_array['email'] : 
                              (isset($attendee_array['user_email']) ? $attendee_array['user_email'] : ''),
                    'tel' => isset($attendee_array['tel']) ? $attendee_array['tel'] : 
                            (isset($attendee_array['phone']) ? $attendee_array['phone'] : ''),
                    'phone' => isset($attendee_array['phone']) ? $attendee_array['phone'] : 
                              (isset($attendee_array['tel']) ? $attendee_array['tel'] : '')
                );
            }
        }
        
        // Merge: Use attendees_info from JSON as primary source, supplement with table attendees if needed
        // If JSON has fewer entries than table, merge them (JSON takes priority for matching indices)
        if (empty($attendees_info) && !empty($table_attendees)) {
            // No JSON data, use table data
            $attendees_info = $table_attendees;
        } elseif (!empty($attendees_info) && !empty($table_attendees)) {
            // Both exist - merge them, prioritizing JSON but adding any missing from table
            $merged = $attendees_info;
            // If table has more attendees than JSON, add the extras
            if (count($table_attendees) > count($attendees_info)) {
                for ($i = count($attendees_info); $i < count($table_attendees); $i++) {
                    $merged[] = $table_attendees[$i];
                }
            }
            $attendees_info = $merged;
        }
        
        // Extract primary attendee information from attendees table if available
        $primary_attendee = array();
        if (!empty($attendees)) {
            // Use first attendee from attendees table
            $primary_attendee = (array) $attendees[0];
        } elseif (isset($attendees_info[0])) {
            // Fallback to attendees_info JSON
            $primary_attendee = $attendees_info[0];
        }
        
        // Get name - try primary attendee first, then booking fields
        $name = '';
        if (!empty($primary_attendee['name'])) {
            $name = $primary_attendee['name'];
        } elseif (isset($primary_attendee['first_name']) || isset($primary_attendee['last_name'])) {
            $name = trim((isset($primary_attendee['first_name']) ? $primary_attendee['first_name'] : '') . ' ' . (isset($primary_attendee['last_name']) ? $primary_attendee['last_name'] : ''));
        } elseif (isset($booking->first_name) || isset($booking->last_name)) {
            $name = trim((isset($booking->first_name) ? $booking->first_name : '') . ' ' . (isset($booking->last_name) ? $booking->last_name : ''));
        }
        
        // Debug: Show all available fields
        $all_fields = array();
        foreach ($booking as $key => $value) {
            $all_fields[$key] = $value;
        }
        
        return array(
            'id' => isset($booking->id) ? $booking->id : 0,
            'event_id' => isset($booking->event_id) ? $booking->event_id : 0,
            'name' => $name,
            'first_name' => isset($booking->first_name) ? $booking->first_name : (isset($primary_attendee['name']) ? $primary_attendee['name'] : ''),
            'last_name' => isset($booking->last_name) ? $booking->last_name : '',
            'email' => isset($primary_attendee['email']) ? $primary_attendee['email'] : (isset($booking->email) ? $booking->email : ''),
            'phone' => isset($primary_attendee['tel']) ? $primary_attendee['tel'] : (isset($primary_attendee['phone']) ? $primary_attendee['phone'] : ''),
            'tickets' => isset($booking->tickets) ? $booking->tickets : 1,
            'count' => isset($booking->tickets) ? $booking->tickets : 1,
            'status' => isset($booking->status) ? $booking->status : 'confirmed',
            'transaction_id' => isset($booking->transaction_id) ? $booking->transaction_id : '',
            'date' => isset($booking->date) ? $booking->date : '',
            'created_at' => isset($booking->timestamp) ? $booking->timestamp : '',
            'price' => isset($booking->price) ? $booking->price : 0,
            'attendees_info' => $attendees_info,
            'raw_booking' => $booking,
            'debug_all_fields' => $all_fields,
            'debug_attendees' => $attendees,
            'debug_user_query' => $debug_user_query
        );
    }
    
    private function format_event_data($post_id) {
        $post = get_post($post_id);
        
        // Get all MEC metadata
        $mec_start_date = get_post_meta($post_id, 'mec_start_date', true);
        $mec_end_date = get_post_meta($post_id, 'mec_end_date', true);
        $mec_start_datetime = get_post_meta($post_id, 'mec_start_datetime', true);
        $mec_end_datetime = get_post_meta($post_id, 'mec_end_datetime', true);
        $mec_location_id = get_post_meta($post_id, 'mec_location_id', true);
        $mec_address = get_post_meta($post_id, 'mec_address', true);
        $mec_bookings_limit = get_post_meta($post_id, 'mec_bookings_limit', true);
        
        // Get timestamps
        $mec_start_day_seconds = get_post_meta($post_id, 'mec_start_day_seconds', true);
        $mec_end_day_seconds = get_post_meta($post_id, 'mec_end_day_seconds', true);
        
        // Calculate timestamps if we have the datetime
        $start_timestamp = $mec_start_datetime ? strtotime($mec_start_datetime) : ($mec_start_date ? strtotime($mec_start_date) : null);
        $end_timestamp = $mec_end_datetime ? strtotime($mec_end_datetime) : ($mec_end_date ? strtotime($mec_end_date) : null);
        
        // Get featured image
        $thumbnail_id = get_post_thumbnail_id($post_id);
        $thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url($thumbnail_id, 'full') : '';
        
        return array(
            'id' => $post_id,
            'title' => get_the_title($post_id),
            'content' => get_post_field('post_content', $post_id),
            'date' => $post->post_date,
            'modified' => $post->post_modified,
            'status' => $post->post_status,
            'featured_image' => $thumbnail_url,
            'meta' => array(
                'mec_start_date' => $mec_start_date,
                'mec_end_date' => $mec_end_date,
                'mec_start_datetime' => $mec_start_datetime,
                'mec_end_datetime' => $mec_end_datetime,
                'mec_location_id' => $mec_location_id,
                'mec_address' => $mec_address,
                'mec_bookings_limit' => $mec_bookings_limit,
            ),
            'time' => array(
                'start_timestamp' => $start_timestamp,
                'end_timestamp' => $end_timestamp,
                'start_date' => $mec_start_date,
                'end_date' => $mec_end_date,
            )
        );
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>MEC API Bridge Settings</h1>
            
            <form method="post" action="options.php">
                <?php settings_fields('mec_api_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">API Key</th>
                        <td>
                            <input type="text" name="mec_api_key" value="<?php echo esc_attr(get_option('mec_api_key')); ?>" class="regular-text" />
                            <p class="description">Your MEC Event API addon key (if you have the official addon)</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Webhook URL</th>
                        <td>
                            <input type="url" name="mec_api_webhook_url" value="<?php echo esc_attr(get_option('mec_api_webhook_url')); ?>" class="regular-text" />
                            <p class="description">The URL where MEC data will be sent</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Webhook Secret</th>
                        <td>
                            <input type="text" name="mec_api_webhook_secret" value="<?php echo esc_attr(get_option('mec_api_webhook_secret')); ?>" class="regular-text" />
                            <p class="description">Secret key for webhook authentication</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Enable API Bridge</th>
                        <td>
                            <label>
                                <input type="checkbox" name="mec_api_enabled" value="1" <?php checked(get_option('mec_api_enabled'), 1); ?> />
                                Enable API bridge notifications
                            </label>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button('Save Changes'); ?>
            </form>
            
            <hr>
            
            <h2>Test API Bridge</h2>
            <p>Click the button below to send a test webhook to your endpoint.</p>
            <button type="button" id="test-api-btn" class="button button-secondary">Send Test API Call</button>
            <div id="test-api-result"></div>
            
            <script>
            document.getElementById('test-api-btn').addEventListener('click', function() {
                var button = this;
                var result = document.getElementById('test-api-result');
                
                button.disabled = true;
                button.textContent = 'Sending...';
                result.innerHTML = '';
                
                // Get form data
                var webhookUrl = document.querySelector('input[name="mec_api_webhook_url"]').value;
                var webhookSecret = document.querySelector('input[name="mec_api_webhook_secret"]').value;
                var apiKey = document.querySelector('input[name="mec_api_key"]').value;
                
                if (!webhookUrl) {
                    button.disabled = false;
                    button.textContent = 'Send Test API Call';
                    result.innerHTML = '<div class="notice notice-error"><p>❌ Please configure webhook URL first</p></div>';
                    return;
                }
                
                // Create test data in MEC API format
                var testData = {
                    event_type: 'test.api',
                    data: {
                        message: 'This is a test API call from MEC API Bridge',
                        api_version: '1.0',
                        timestamp: new Date().toISOString()
                    },
                    timestamp: new Date().toISOString(),
                    site_url: '<?php echo get_site_url(); ?>',
                    api_key: apiKey || 'test-key'
                };
                
                // Prepare headers
                var headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'MEC-API-Bridge/1.0',
                    'X-API-Key': apiKey || 'test-key'
                };
                
                // Add signature if secret is provided
                if (webhookSecret) {
                    if (typeof CryptoJS !== 'undefined') {
                        var signature = CryptoJS.HmacSHA256(JSON.stringify(testData), webhookSecret).toString();
                        headers['X-MEC-Signature'] = signature;
                    } else {
                        headers['X-MEC-Signature'] = 'test-signature';
                    }
                }
                
                // Send test API call
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(testData),
                    mode: 'cors'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    button.disabled = false;
                    button.textContent = 'Send Test API Call';
                    
                    if (data.success) {
                        result.innerHTML = '<div class="notice notice-success"><p>✅ ' + data.message + '</p></div>';
                    } else {
                        result.innerHTML = '<div class="notice notice-error"><p>❌ ' + data.message + '</p></div>';
                    }
                })
                .catch(error => {
                    button.disabled = false;
                    button.textContent = 'Send Test API Call';
                    result.innerHTML = '<div class="notice notice-error"><p>❌ Error: ' + error.message + '</p></div>';
                });
            });
            </script>
            
            <!-- Include CryptoJS for proper HMAC-SHA256 -->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
        </div>
        <?php
    }
    
    /**
     * Handle event save/update
     */
    public function on_event_saved($post_id, $post) {
        if ($post->post_type !== 'mec-events' || $post->post_status === 'auto-draft') {
            return;
        }
        
        if (get_option('mec_api_enabled') != 1) {
            return;
        }
        
        $this->send_event_data('event.saved', $post_id);
    }
    
    /**
     * Handle event status changes
     */
    public function on_event_status_changed($new_status, $old_status, $post) {
        if ($post->post_type !== 'mec-events') {
            return;
        }
        
        if (get_option('mec_api_enabled') != 1) {
            return;
        }
        
        if ($new_status === 'publish' && $old_status !== 'publish') {
            $this->send_event_data('event.published', $post->ID);
        }
    }
    
    /**
     * Handle event deletion
     */
    public function on_event_deleted($post_id) {
        if (get_post_type($post_id) !== 'mec-events') {
            return;
        }
        
        if (get_option('mec_api_enabled') != 1) {
            return;
        }
        
        $this->send_webhook('event.deleted', array(
            'event_id' => $post_id,
            'deleted_at' => current_time('mysql')
        ));
    }
    
    /**
     * Handle booking completion
     */
    public function on_booking_completed($booking_id) {
        if (get_option('mec_api_enabled') != 1) {
            return;
        }
        
        $this->send_booking_data('booking.completed', $booking_id);
    }
    
    /**
     * Handle booking cancellation
     */
    public function on_booking_canceled($booking_id) {
        if (get_option('mec_api_enabled') != 1) {
            return;
        }
        
        $this->send_booking_data('booking.canceled', $booking_id);
    }
    
    /**
     * Send event data
     */
    private function send_event_data($event_type, $event_id) {
        $event_data = $this->get_event_data($event_id);
        if (!$event_data) {
            return false;
        }
        
        $this->send_webhook($event_type, array(
            'event_id' => $event_id,
            'event_data' => $event_data
        ));
    }
    
    /**
     * Send booking data
     */
    private function send_booking_data($event_type, $booking_id) {
        $booking_data = $this->get_booking_data($booking_id);
        if (!$booking_data) {
            return false;
        }
        
        $this->send_webhook($event_type, array(
            'booking_id' => $booking_id,
            'booking_data' => $booking_data
        ));
    }
    
    /**
     * Get event data in MEC API format
     */
    private function get_event_data($event_id) {
        $event = get_post($event_id);
        if (!$event) {
            return null;
        }
        
        // Get MEC event meta
        $mec_data = get_post_meta($event_id, 'mec_event', true);
        
        // Format event data similar to MEC API
        $event_data = array(
            'id' => $event_id,
            'title' => $event->post_title,
            'description' => $event->post_content,
            'excerpt' => $event->post_excerpt,
            'status' => $event->post_status,
            'created_at' => $event->post_date,
            'updated_at' => $event->post_modified,
            'featured_image' => get_the_post_thumbnail_url($event_id, 'full'),
            'mec_data' => $mec_data
        );
        
        // Add event dates if available
        if (isset($mec_data['start']['date'])) {
            $event_data['start_date'] = $mec_data['start']['date'];
            $event_data['start_time'] = isset($mec_data['start']['hour']) ? 
                $mec_data['start']['hour'] . ':' . $mec_data['start']['minutes'] : '';
        }
        
        if (isset($mec_data['end']['date'])) {
            $event_data['end_date'] = $mec_data['end']['date'];
            $event_data['end_time'] = isset($mec_data['end']['hour']) ? 
                $mec_data['end']['hour'] . ':' . $mec_data['end']['minutes'] : '';
        }
        
        // Add location if available
        if (isset($mec_data['location']['name'])) {
            $event_data['location'] = $mec_data['location']['name'];
        }
        
        return $event_data;
    }
    
    /**
     * Get booking data
     */
    private function get_booking_data($booking_id) {
        // This would need to be adapted based on your MEC booking structure
        return array(
            'id' => $booking_id,
            'event_id' => 1, // Would need to get actual event ID
            'attendee_name' => 'Sample Attendee',
            'attendee_email' => 'sample@example.com',
            'attendee_phone' => '555-1234',
            'tickets' => 1,
            'status' => 'completed',
            'created_at' => current_time('mysql')
        );
    }
    
    /**
     * Send webhook
     */
    private function send_webhook($event_type, $data) {
        if (empty($this->webhook_url)) {
            return false;
        }
        
        $payload = array(
            'event_type' => $event_type,
            'data' => $data,
            'timestamp' => current_time('mysql'),
            'site_url' => get_site_url(),
            'api_key' => $this->api_key
        );
        
        $headers = array(
            'Content-Type' => 'application/json',
            'User-Agent' => 'MEC-API-Bridge/1.0',
            'X-API-Key' => $this->api_key
        );
        
        // Add signature if secret is configured
        if (!empty($this->webhook_secret)) {
            $signature = hash_hmac('sha256', json_encode($payload), $this->webhook_secret);
            $headers['X-MEC-Signature'] = $signature;
        }
        
        $response = wp_remote_post($this->webhook_url, array(
            'headers' => $headers,
            'body' => json_encode($payload),
            'timeout' => 15,
            'blocking' => false // Don't wait for response
        ));
        
        // Log errors
        if (is_wp_error($response)) {
            error_log('MEC API Bridge Error: ' . $response->get_error_message());
            return false;
        }
        
        return true;
    }
}

// Initialize the plugin
new MEC_API_Bridge();
