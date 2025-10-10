<?php
/**
 * Plugin Name: MEC Webhook Bridge
 * Description: Sends MEC event and booking data to external webhook endpoints
 * Version: 1.0.3
 * Author: Your Name
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class MEC_Webhook_Bridge_Fixed {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    public function add_menu() {
        add_options_page(
            'MEC Webhook Bridge',
            'MEC Webhook Bridge',
            'manage_options',
            'mec-webhook-bridge',
            array($this, 'admin_page')
        );
    }
    
    public function register_settings() {
        register_setting('mec_webhook_settings', 'mec_webhook_url');
        register_setting('mec_webhook_settings', 'mec_webhook_secret');
        register_setting('mec_webhook_settings', 'mec_webhook_enabled');
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>MEC Webhook Bridge Settings</h1>
            
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
                        message: 'This is a test webhook from MEC Webhook Bridge'
                    },
                    timestamp: new Date().toISOString(),
                    site_url: '<?php echo get_site_url(); ?>'
                };
                
                // Prepare headers
                var headers = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'MEC-Webhook-Bridge/1.0'
                };
                
                // Add signature if secret is provided
                if (webhookSecret) {
                    // Use CryptoJS for HMAC-SHA256 (if available) or fallback to simple hash
                    if (typeof CryptoJS !== 'undefined') {
                        var signature = CryptoJS.HmacSHA256(JSON.stringify(testData), webhookSecret).toString();
                        headers['X-MEC-Signature'] = signature;
                    } else {
                        // Fallback: use a simple hash (not secure, but will work for testing)
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
new MEC_Webhook_Bridge_Fixed();
