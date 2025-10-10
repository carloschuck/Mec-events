<?php
/**
 * Plugin Name: MEC Webhook Complete
 * Description: Complete MEC webhook integration with proper event hooks
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class MEC_Webhook_Complete {
    
    private $webhook_url;
    private $webhook_secret;
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        
        // Get settings
        $this->webhook_url = get_option('mec_webhook_url', '');
        $this->webhook_secret = get_option('mec_webhook_secret', '');
        
        // Initialize hooks
        $this->init_hooks();
    }
    
    public function add_menu() {
        add_options_page(
            'MEC Webhook Complete',
            'MEC Webhook Complete',
            'manage_options',
            'mec-webhook-complete',
            array($this, 'admin_page')
        );
    }
    
    public function register_settings() {
        register_setting('mec_webhook_settings', 'mec_webhook_url');
        register_setting('mec_webhook_settings', 'mec_webhook_secret');
        register_setting('mec_webhook_settings', 'mec_webhook_enabled');
    }
    
    private function init_hooks() {
        if (get_option('mec_webhook_enabled') != 1) {
            return;
        }
        
        // WordPress post hooks (these should work for MEC events)
        add_action('save_post', array($this, 'on_post_saved'), 10, 2);
        add_action('transition_post_status', array($this, 'on_post_status_changed'), 10, 3);
        add_action('before_delete_post', array($this, 'on_post_deleted'), 10, 1);
        
        // MEC specific hooks (if available)
        add_action('mec_save_event_data', array($this, 'on_mec_event_saved'), 10, 2);
        add_action('mec_event_published', array($this, 'on_mec_event_published'), 10, 1);
        add_action('mec_event_updated', array($this, 'on_mec_event_updated'), 10, 1);
        
        // Booking hooks
        add_action('mec_booking_completed', array($this, 'on_booking_completed'), 10, 1);
        add_action('mec_booking_canceled', array($this, 'on_booking_canceled'), 10, 1);
        
        // Debug: Log all post saves
        add_action('save_post', array($this, 'debug_post_save'), 5, 2);
    }
    
    public function debug_post_save($post_id, $post) {
        error_log("MEC Webhook Debug: Post saved - ID: $post_id, Type: " . $post->post_type . ", Status: " . $post->post_status);
    }
    
    public function on_post_saved($post_id, $post) {
        // Only handle MEC events
        if ($post->post_type !== 'mec-events') {
            return;
        }
        
        // Skip auto-drafts and revisions
        if ($post->post_status === 'auto-draft' || wp_is_post_revision($post_id)) {
            return;
        }
        
        error_log("MEC Webhook: Event saved - ID: $post_id, Title: " . $post->post_title);
        
        $this->send_event_webhook('event.saved', $post_id, $post);
    }
    
    public function on_post_status_changed($new_status, $old_status, $post) {
        if ($post->post_type !== 'mec-events') {
            return;
        }
        
        error_log("MEC Webhook: Event status changed - ID: " . $post->ID . ", From: $old_status, To: $new_status");
        
        if ($new_status === 'publish' && $old_status !== 'publish') {
            $this->send_event_webhook('event.published', $post->ID, $post);
        } elseif ($new_status === 'trash') {
            $this->send_event_webhook('event.deleted', $post->ID, $post);
        }
    }
    
    public function on_post_deleted($post_id) {
        if (get_post_type($post_id) !== 'mec-events') {
            return;
        }
        
        error_log("MEC Webhook: Event deleted - ID: $post_id");
        
        $this->send_webhook('event.deleted', array(
            'event_id' => $post_id,
            'deleted_at' => current_time('mysql')
        ));
    }
    
    // MEC specific hooks (if they exist)
    public function on_mec_event_saved($event_id, $event_data) {
        error_log("MEC Webhook: MEC event saved - ID: $event_id");
        $this->send_event_webhook('event.saved', $event_id, get_post($event_id));
    }
    
    public function on_mec_event_published($event_id) {
        error_log("MEC Webhook: MEC event published - ID: $event_id");
        $this->send_event_webhook('event.published', $event_id, get_post($event_id));
    }
    
    public function on_mec_event_updated($event_id) {
        error_log("MEC Webhook: MEC event updated - ID: $event_id");
        $this->send_event_webhook('event.updated', $event_id, get_post($event_id));
    }
    
    public function on_booking_completed($booking_id) {
        error_log("MEC Webhook: Booking completed - ID: $booking_id");
        $this->send_booking_webhook('booking.completed', $booking_id);
    }
    
    public function on_booking_canceled($booking_id) {
        error_log("MEC Webhook: Booking canceled - ID: $booking_id");
        $this->send_booking_webhook('booking.canceled', $booking_id);
    }
    
    private function send_event_webhook($event_type, $event_id, $post) {
        $event_data = $this->get_event_data($event_id, $post);
        if (!$event_data) {
            return false;
        }
        
        $this->send_webhook($event_type, array(
            'event_id' => $event_id,
            'event_data' => $event_data
        ));
    }
    
    private function send_booking_webhook($event_type, $booking_id) {
        $booking_data = $this->get_booking_data($booking_id);
        if (!$booking_data) {
            return false;
        }
        
        $this->send_webhook($event_type, array(
            'booking_id' => $booking_id,
            'booking_data' => $booking_data
        ));
    }
    
    private function get_event_data($event_id, $post = null) {
        if (!$post) {
            $post = get_post($event_id);
        }
        
        if (!$post) {
            return null;
        }
        
        // Get MEC event meta
        $mec_data = get_post_meta($event_id, 'mec_event', true);
        
        // Get featured image
        $featured_image = get_the_post_thumbnail_url($event_id, 'full');
        
        // Get event categories
        $categories = wp_get_post_terms($event_id, 'mec_category');
        $category_names = array();
        if (!is_wp_error($categories)) {
            foreach ($categories as $category) {
                $category_names[] = $category->name;
            }
        }
        
        // Get event location
        $location = '';
        $address = '';
        if (isset($mec_data['location']['name'])) {
            $location = $mec_data['location']['name'];
        }
        if (isset($mec_data['location']['address'])) {
            $address = $mec_data['location']['address'];
        }
        
        // Format dates
        $start_date = null;
        $end_date = null;
        if (isset($mec_data['start']['date'])) {
            $start_date = $mec_data['start']['date'];
            if (isset($mec_data['start']['hour']) && isset($mec_data['start']['minutes'])) {
                $start_date .= ' ' . $mec_data['start']['hour'] . ':' . $mec_data['start']['minutes'] . ':00';
            }
        }
        
        if (isset($mec_data['end']['date'])) {
            $end_date = $mec_data['end']['date'];
            if (isset($mec_data['end']['hour']) && isset($mec_data['end']['minutes'])) {
                $end_date .= ' ' . $mec_data['end']['hour'] . ':' . $mec_data['end']['minutes'] . ':00';
            }
        }
        
        return array(
            'id' => $event_id,
            'title' => $post->post_title,
            'description' => $post->post_content,
            'excerpt' => $post->post_excerpt,
            'status' => $post->post_status,
            'created_at' => $post->post_date,
            'updated_at' => $post->post_modified,
            'featured_image' => $featured_image,
            'start_date' => $start_date,
            'end_date' => $end_date,
            'location' => $location,
            'address' => $address,
            'categories' => $category_names,
            'mec_data' => $mec_data
        );
    }
    
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
    
    private function send_webhook($event_type, $data) {
        if (empty($this->webhook_url)) {
            error_log('MEC Webhook: No webhook URL configured');
            return false;
        }
        
        $payload = array(
            'event_type' => $event_type,
            'data' => $data,
            'timestamp' => current_time('mysql'),
            'site_url' => get_site_url()
        );
        
        $headers = array(
            'Content-Type' => 'application/json',
            'User-Agent' => 'MEC-Webhook-Complete/1.0'
        );
        
        // Add signature if secret is configured
        if (!empty($this->webhook_secret)) {
            $signature = hash_hmac('sha256', json_encode($payload), $this->webhook_secret);
            $headers['X-MEC-Signature'] = $signature;
        }
        
        error_log('MEC Webhook: Sending webhook - Type: ' . $event_type . ', URL: ' . $this->webhook_url);
        
        $response = wp_remote_post($this->webhook_url, array(
            'headers' => $headers,
            'body' => json_encode($payload),
            'timeout' => 15,
            'blocking' => true // Wait for response to debug
        ));
        
        if (is_wp_error($response)) {
            error_log('MEC Webhook Error: ' . $response->get_error_message());
            return false;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        
        error_log('MEC Webhook Response: Code ' . $response_code . ', Body: ' . $response_body);
        
        return $response_code >= 200 && $response_code < 300;
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>MEC Webhook Complete Settings</h1>
            
            <form method="post" action="options.php">
                <?php settings_fields('mec_webhook_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">Webhook URL</th>
                        <td>
                            <input type="url" name="mec_webhook_url" value="<?php echo esc_attr(get_option('mec_webhook_url')); ?>" class="regular-text" />
                            <p class="description">The URL where MEC data will be sent</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Webhook Secret</th>
                        <td>
                            <input type="text" name="mec_webhook_secret" value="<?php echo esc_attr(get_option('mec_webhook_secret')); ?>" class="regular-text" />
                            <p class="description">Secret key for webhook authentication</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Enable Webhooks</th>
                        <td>
                            <label>
                                <input type="checkbox" name="mec_webhook_enabled" value="1" <?php checked(get_option('mec_webhook_enabled'), 1); ?> />
                                Enable webhook notifications
                            </label>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button('Save Changes'); ?>
            </form>
            
            <hr>
            
            <h2>Test Webhook</h2>
            <p>Click the button below to send a test webhook to your endpoint.</p>
            <button type="button" id="test-webhook-btn" class="button button-secondary">Send Test Webhook</button>
            <div id="test-webhook-result"></div>
            
            <h2>Debug Information</h2>
            <p>Check your WordPress error logs for webhook activity. Recent events should show debug messages.</p>
            
            <script>
            document.getElementById('test-webhook-btn').addEventListener('click', function() {
                var button = this;
                var result = document.getElementById('test-webhook-result');
                
                button.disabled = true;
                button.textContent = 'Sending...';
                result.innerHTML = '';
                
                // Get form data
                var webhookUrl = document.querySelector('input[name="mec_webhook_url"]').value;
                var webhookSecret = document.querySelector('input[name="mec_webhook_secret"]').value;
                
                if (!webhookUrl) {
                    button.disabled = false;
                    button.textContent = 'Send Test Webhook';
                    result.innerHTML = '<div class="notice notice-error"><p>❌ Please configure webhook URL first</p></div>';
                    return;
                }
                
                // Create test data
                var testData = {
                    event_type: 'test.webhook',
                    data: {
                        message: 'This is a test webhook from MEC Webhook Complete'
                    },
                    timestamp: new Date().toISOString(),
                    site_url: '<?php echo get_site_url(); ?>'
                };
                
                // Prepare headers
                var headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'MEC-Webhook-Complete/1.0'
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
                
                // Send test webhook
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
                    button.textContent = 'Send Test Webhook';
                    
                    if (data.success) {
                        result.innerHTML = '<div class="notice notice-success"><p>✅ ' + data.message + '</p></div>';
                    } else {
                        result.innerHTML = '<div class="notice notice-error"><p>❌ ' + data.message + '</p></div>';
                    }
                })
                .catch(error => {
                    button.disabled = false;
                    button.textContent = 'Send Test Webhook';
                    result.innerHTML = '<div class="notice notice-error"><p>❌ Error: ' + error.message + '</p></div>';
                });
            });
            </script>
            
            <!-- Include CryptoJS for proper HMAC-SHA256 -->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
        </div>
        <?php
    }
}

// Initialize the plugin
new MEC_Webhook_Complete();
