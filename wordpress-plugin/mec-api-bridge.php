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
        
        // Hook into MEC events if API key is configured
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
