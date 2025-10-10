<?php
/**
 * Plugin Name: MEC Webhook Bridge
 * Plugin URI: https://github.com/yourusername/mec-webhook-bridge
 * Description: Sends MEC event and booking data to external webhook endpoints
 * Version: 1.0.0
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * License: GPL v2 or later
 * Text Domain: mec-webhook-bridge
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class MEC_Webhook_Bridge {
    
    private $webhook_url;
    private $webhook_secret;
    
    public function __construct() {
        // Initialize hooks
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        
        // Get settings
        $this->webhook_url = get_option('mec_webhook_url', '');
        $this->webhook_secret = get_option('mec_webhook_secret', '');
        
        // Only add MEC hooks if webhook URL is configured
        if (!empty($this->webhook_url)) {
            $this->init_mec_hooks();
        }
    }
    
    /**
     * Initialize MEC event hooks
     */
    private function init_mec_hooks() {
        // Event hooks
        add_action('mec_save_event_data', array($this, 'on_event_saved'), 10, 2);
        add_action('mec_event_published', array($this, 'on_event_published'), 10, 1);
        add_action('before_delete_post', array($this, 'on_event_deleted'), 10, 1);
        
        // Booking hooks
        add_action('mec_booking_completed', array($this, 'on_booking_completed'), 10, 1);
        add_action('mec_booking_canceled', array($this, 'on_booking_canceled'), 10, 1);
        add_action('mec_booking_confirmed', array($this, 'on_booking_confirmed'), 10, 1);
        
        // Check-in hooks (if available)
        add_action('mec_attendee_checked_in', array($this, 'on_attendee_checked_in'), 10, 2);
    }
    
    /**
     * Add settings page to WordPress admin
     */
    public function add_settings_page() {
        add_options_page(
            'MEC Webhook Bridge Settings',
            'MEC Webhook Bridge',
            'manage_options',
            'mec-webhook-bridge',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting('mec_webhook_bridge', 'mec_webhook_url');
        register_setting('mec_webhook_bridge', 'mec_webhook_secret');
        register_setting('mec_webhook_bridge', 'mec_webhook_enabled');
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>MEC Webhook Bridge Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('mec_webhook_bridge'); ?>
                <?php do_settings_sections('mec_webhook_bridge'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="mec_webhook_url">Webhook URL</label>
                        </th>
                        <td>
                            <input type="url" 
                                   name="mec_webhook_url" 
                                   id="mec_webhook_url" 
                                   value="<?php echo esc_attr(get_option('mec_webhook_url')); ?>" 
                                   class="regular-text"
                                   placeholder="http://localhost:3001/api/webhooks/mec" />
                            <p class="description">The URL where MEC data will be sent</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="mec_webhook_secret">Webhook Secret</label>
                        </th>
                        <td>
                            <input type="text" 
                                   name="mec_webhook_secret" 
                                   id="mec_webhook_secret" 
                                   value="<?php echo esc_attr(get_option('mec_webhook_secret')); ?>" 
                                   class="regular-text"
                                   placeholder="your-secret-key" />
                            <p class="description">Secret key for webhook authentication</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="mec_webhook_enabled">Enable Webhooks</label>
                        </th>
                        <td>
                            <input type="checkbox" 
                                   name="mec_webhook_enabled" 
                                   id="mec_webhook_enabled" 
                                   value="1" 
                                   <?php checked(1, get_option('mec_webhook_enabled'), true); ?> />
                            <label for="mec_webhook_enabled">Enable webhook notifications</label>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <hr>
            
            <h2>Test Webhook</h2>
            <p>Click the button below to send a test webhook to your endpoint.</p>
            <button type="button" class="button button-secondary" id="test-webhook">Send Test Webhook</button>
            <div id="test-result" style="margin-top: 10px;"></div>
            
            <script>
            jQuery(document).ready(function($) {
                $('#test-webhook').on('click', function() {
                    var button = $(this);
                    var result = $('#test-result');
                    
                    button.prop('disabled', true).text('Sending...');
                    result.html('');
                    
                    $.post(ajaxurl, {
                        action: 'mec_test_webhook'
                    }, function(response) {
                        button.prop('disabled', false).text('Send Test Webhook');
                        if (response.success) {
                            result.html('<div class="notice notice-success"><p>✅ ' + response.data + '</p></div>');
                        } else {
                            result.html('<div class="notice notice-error"><p>❌ ' + response.data + '</p></div>');
                        }
                    });
                });
            });
            </script>
        </div>
        <?php
    }
    
    /**
     * When an event is saved/updated
     */
    public function on_event_saved($event_id, $event_data) {
        $this->send_webhook('event.saved', array(
            'event_id' => $event_id,
            'event_data' => $this->get_event_data($event_id)
        ));
    }
    
    /**
     * When an event is published
     */
    public function on_event_published($event_id) {
        $this->send_webhook('event.published', array(
            'event_id' => $event_id,
            'event_data' => $this->get_event_data($event_id)
        ));
    }
    
    /**
     * When an event is deleted
     */
    public function on_event_deleted($post_id) {
        if (get_post_type($post_id) === 'mec-events') {
            $this->send_webhook('event.deleted', array(
                'event_id' => $post_id
            ));
        }
    }
    
    /**
     * When a booking is completed
     */
    public function on_booking_completed($booking_id) {
        $this->send_webhook('booking.completed', array(
            'booking_id' => $booking_id,
            'booking_data' => $this->get_booking_data($booking_id)
        ));
    }
    
    /**
     * When a booking is canceled
     */
    public function on_booking_canceled($booking_id) {
        $this->send_webhook('booking.canceled', array(
            'booking_id' => $booking_id,
            'booking_data' => $this->get_booking_data($booking_id)
        ));
    }
    
    /**
     * When a booking is confirmed
     */
    public function on_booking_confirmed($booking_id) {
        $this->send_webhook('booking.confirmed', array(
            'booking_id' => $booking_id,
            'booking_data' => $this->get_booking_data($booking_id)
        ));
    }
    
    /**
     * When an attendee is checked in
     */
    public function on_attendee_checked_in($booking_id, $attendee_id) {
        $this->send_webhook('attendee.checked_in', array(
            'booking_id' => $booking_id,
            'attendee_id' => $attendee_id,
            'booking_data' => $this->get_booking_data($booking_id)
        ));
    }
    
    /**
     * Get event data
     */
    private function get_event_data($event_id) {
        $event = get_post($event_id);
        if (!$event) return null;
        
        // Get MEC event details
        $mec_data = get_post_meta($event_id, 'mec_event', true);
        
        return array(
            'id' => $event_id,
            'title' => $event->post_title,
            'description' => $event->post_content,
            'status' => $event->post_status,
            'mec_data' => $mec_data,
            'permalink' => get_permalink($event_id)
        );
    }
    
    /**
     * Get booking data
     */
    private function get_booking_data($booking_id) {
        global $wpdb;
        
        // Get booking from MEC bookings table
        $booking = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM `#__mec_bookings` WHERE `id` = %d",
            $booking_id
        ), ARRAY_A);
        
        return $booking;
    }
    
    /**
     * Send webhook to configured endpoint
     */
    private function send_webhook($event_type, $data) {
        if (empty($this->webhook_url) || get_option('mec_webhook_enabled') != 1) {
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
            'User-Agent' => 'MEC-Webhook-Bridge/1.0'
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
            error_log('MEC Webhook Error: ' . $response->get_error_message());
            return false;
        }
        
        return true;
    }
}

// Initialize plugin
new MEC_Webhook_Bridge();

// AJAX handler for test webhook
add_action('wp_ajax_mec_test_webhook', function() {
    $webhook_url = get_option('mec_webhook_url');
    
    if (empty($webhook_url)) {
        wp_send_json_error('Webhook URL is not configured');
        return;
    }
    
    $test_data = array(
        'event_type' => 'test.webhook',
        'data' => array(
            'message' => 'This is a test webhook from MEC Webhook Bridge'
        ),
        'timestamp' => current_time('mysql'),
        'site_url' => get_site_url()
    );
    
    $response = wp_remote_post($webhook_url, array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'X-MEC-Signature' => hash_hmac('sha256', json_encode($test_data), get_option('mec_webhook_secret', ''))
        ),
        'body' => json_encode($test_data),
        'timeout' => 15
    ));
    
    if (is_wp_error($response)) {
        wp_send_json_error('Failed to send webhook: ' . $response->get_error_message());
    } else {
        $status = wp_remote_retrieve_response_code($response);
        if ($status >= 200 && $status < 300) {
            wp_send_json_success('Test webhook sent successfully! Response code: ' . $status);
        } else {
            wp_send_json_error('Webhook returned error code: ' . $status);
        }
    }
});

