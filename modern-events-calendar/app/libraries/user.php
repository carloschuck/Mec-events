<?php

/** no direct access **/
defined('MECEXEC') or die();

/**
 * Webnus MEC User class.
 * @author Webnus <info@webnus.net>
 */
class MEC_user extends MEC_base
{
    /**
     * @var MEC_main
     */
    public $main;

    /**
     * @var MEC_db
     */
    public $db;

    /**
     * @var array
     */
    public $settings;

    /**
     * Constructor method
     * @author Webnus <info@webnus.net>
     */
    public function __construct()
    {
        // MEC Main library
        $this->main = $this->getMain();

        // MEC DB Library
        $this->db = $this->getDB();

        // MEC settings
        $this->settings = $this->main->get_settings();
    }

    public function register($attendee, $args)
    {
        $name = $attendee['name'] ?? '';
        $raw = (isset($attendee['reg']) and is_array($attendee['reg'])) ? $attendee['reg'] : [];

        $email = $attendee['email'] ?? '';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return false;

        $reg = [];
        foreach ($raw as $k => $v) $reg[$k] = (is_array($v) ? $v : stripslashes($v));

        $existed_user_id = $this->main->email_exists($email);

        // User already exist
        if ($existed_user_id !== false) {
            // Map Data
            $event_id = $args['event_id'] ?? 0;
            if ($event_id) $this->save_mapped_data($event_id, $existed_user_id, $reg);

            return $existed_user_id;
        }

        // Update WordPress user first name and last name
        if (strpos($name, ',') !== false) $ex = explode(',', $name);
        else $ex = explode(' ', $name);

        $first_name = $ex[0] ?? '';
        $last_name = '';

        if (isset($ex[1])) {
            unset($ex[0]);
            $last_name = implode(' ', $ex);
        }

        // Check if BuddyBoss is active and enabled
        $buddyboss_active = (function_exists('buddypress') || class_exists('BuddyPress') ||
            function_exists('bp_is_active') || class_exists('BP_Core_Bootstrap') ||
            defined('BP_PLUGIN_DIR') || class_exists('BuddyBoss'));

        // BuddyBoss specific registration with enhanced username handling
        if ($buddyboss_active) {
            // Check if registration is disabled for BuddyBoss - if so, only create MEC user, not WordPress/BuddyBoss user
            $MEC_method = isset($args['register_in_mec']) && $args['register_in_mec'];
            $registration_disabled = (isset($this->settings['booking_registration']) && !$this->settings['booking_registration']);

            if ($MEC_method || $registration_disabled) {
                $existed_user_id = $this->db->select("SELECT `id` FROM `#__mec_users` WHERE `email`='" . $this->db->escape($email) . "'", 'loadResult');

                // User already exist
                if ($existed_user_id) return $existed_user_id;

                $now = date('Y-m-d H:i:s');
                $user_id = (int) $this->db->q("INSERT INTO `#__mec_users` (`first_name`,`last_name`,`email`,`reg`,`created_at`,`updated_at`) VALUES ('" . $this->db->escape($first_name) . "','" . $this->db->escape($last_name) . "','" . $this->db->escape($email) . "','" . $this->db->escape(json_encode($reg)) . "','" . $now . "','" . $now . "')", "INSERT");

                // Make sure we won't create MEC users with id lower than 1 million
                // To avoid conflicts with wp users of course
                if ($user_id < 1000000) {
                    $new_id = $user_id + 1000000;
                    $this->db->q("UPDATE `#__mec_users` SET `id`='" . esc_sql($new_id) . "' WHERE `id`='" . esc_sql($user_id) . "'");

                    $user_id = $new_id;
                }

                return $user_id;
            }


            // Start session if not already started
            if (!session_id()) {
                session_start();
            }

            // Start with name as default for auto mode, email as fallback
            $username = '';
            
            // PRIORITY 1: Use name field when in auto mode
            if (!empty($name) && trim($name) !== $email) {
                // Clean the name: replace spaces with dashes and remove special characters
                $clean_name = trim($name);
                $clean_name = preg_replace('/\s+/', '-', $clean_name); // Replace spaces with dashes
                $clean_name = preg_replace('/[^a-zA-Z0-9\-]/', '', $clean_name); // Remove special characters except letters, numbers, and dashes
                $clean_name = preg_replace('/-+/', '-', $clean_name); // Replace multiple dashes with single dash
                $clean_name = trim($clean_name, '-'); // Remove leading/trailing dashes
                
                $name_username = function_exists('sanitize_user') ? sanitize_user($clean_name) : $clean_name;
                if (!empty($name_username) && $name_username !== $email) {
                    $username = $name_username;
                    // Store in session for later use
                    $_SESSION['mec_form_username_' . $email] = $username;
                }
            }
            
            // PRIORITY 2: $_POST['book']['username'] (manual mode)
            if (empty($username) && isset($_POST['book']['username']) && !empty(trim($_POST['book']['username']))) {
                $form_username = function_exists('sanitize_user') ? sanitize_user(trim($_POST['book']['username'])) : trim($_POST['book']['username']);
                if (!empty($form_username) && $form_username !== $email) {
                    $username = $form_username;
                    // Store in session for later use
                    $_SESSION['mec_form_username_' . $email] = $username;
                }
            }

            // PRIORITY 3: $_POST['username'] 
            if (empty($username) && isset($_POST['username']) && !empty(trim($_POST['username']))) {
                $form_username = function_exists('sanitize_user') ? sanitize_user(trim($_POST['username'])) : trim($_POST['username']);
                if (!empty($form_username) && $form_username !== $email) {
                    $username = $form_username;
                    // Store in session for later use
                    $_SESSION['mec_form_username_' . $email] = $username;
                }
            }

            // PRIORITY 4: $_REQUEST['book']['username']
            if (empty($username) && isset($_REQUEST['book']['username']) && !empty(trim($_REQUEST['book']['username']))) {
                $form_username = function_exists('sanitize_user') ? sanitize_user(trim($_REQUEST['book']['username'])) : trim($_REQUEST['book']['username']);
                if (!empty($form_username) && $form_username !== $email) {
                    $username = $form_username;
                    // Store in session for later use
                    $_SESSION['mec_form_username_' . $email] = $username;
                }
            }

            // PRIORITY 5: Check session for previously stored username
            if (empty($username) && isset($_SESSION['mec_form_username_' . $email]) && !empty($_SESSION['mec_form_username_' . $email])) {
                $session_username = function_exists('sanitize_user') ? sanitize_user($_SESSION['mec_form_username_' . $email]) : $_SESSION['mec_form_username_' . $email];
                if (!empty($session_username) && $session_username !== $email) {
                    $username = $session_username;
                }
            }
            
            // PRIORITY 6: Fallback to email if no valid username found
            if (empty($username)) {
                $username = function_exists('sanitize_user') ? sanitize_user($email) : $email;
            }

            // Apply filter (but don't let it override our forced username)
            if (function_exists('apply_filters')) {
                $filter_username = apply_filters('mec_user_register_username', $username, $email);
                if (!empty($filter_username) && $filter_username !== $email) {
                    $username = $filter_username;
                }
            }

            // Clean up session after successful registration
            if (isset($_SESSION['mec_form_username_' . $email])) {
                unset($_SESSION['mec_form_username_' . $email]);
            }

            // Generate password from form or auto-generate
            $password = wp_generate_password(12); // Default password
            if (isset($_POST['book']['password']) && !empty($_POST['book']['password'])) {
                $password = sanitize_text_field($_POST['book']['password']);
            }

            // Register User
            $user_id = wp_create_user($username, $password, $email);
            if (is_wp_error($user_id)) return false;

            // Update First Name, Last Name, and Nickname
            $update_data = array('ID' => $user_id);

            if (trim($first_name) or trim($last_name)) {
                $update_data['first_name'] = $first_name;
                $update_data['last_name'] = $last_name;
            }

            // FORCE nickname to be username instead of email
            $update_data['nickname'] = $username;

            wp_update_user($update_data);

            // Map Data
            $event_id = $args['event_id'] ?? 0;
            if ($event_id) $this->save_mapped_data($event_id, $user_id, $reg);

            // Trigger action for user registration (allows other plugins to hook in)
            do_action('mec_user_registered', $user_id, $attendee, $args);

            // BuddyBoss integration will be handled by the action hook
        }
        // Normal registration (non-BuddyBoss)
        else {
            // Register in MEC
            $MEC_method = isset($args['register_in_mec']) && $args['register_in_mec'];

            // Registration is disabled
            if ($MEC_method || (isset($this->settings['booking_registration']) && !$this->settings['booking_registration'])) {
                $existed_user_id = $this->db->select("SELECT `id` FROM `#__mec_users` WHERE `email`='" . $this->db->escape($email) . "'", 'loadResult');

                // User already exist
                if ($existed_user_id) return $existed_user_id;

                $now = date('Y-m-d H:i:s');
                $user_id = (int) $this->db->q("INSERT INTO `#__mec_users` (`first_name`,`last_name`,`email`,`reg`,`created_at`,`updated_at`) VALUES ('" . $this->db->escape($first_name) . "','" . $this->db->escape($last_name) . "','" . $this->db->escape($email) . "','" . $this->db->escape(json_encode($reg)) . "','" . $now . "','" . $now . "')", "INSERT");

                // Make sure we won't create MEC users with id lower than 1 million
                // To avoid conflicts with wp users of course
                if ($user_id < 1000000) {
                    $new_id = $user_id + 1000000;
                    $this->db->q("UPDATE `#__mec_users` SET `id`='" . esc_sql($new_id) . "' WHERE `id`='" . esc_sql($user_id) . "'");

                    $user_id = $new_id;
                }
            } else {
                // 🔥 Extract username/password from $_POST and inject into $args if empty
                if (!isset($args['username']) || !trim($args['username'])) {
                    $args['username'] = $_POST['waiting']['tickets'][1]['username'] ?? '';
                }

                if (!isset($args['password']) || !trim($args['password'])) {
                    $args['password'] = $_POST['waiting']['tickets'][1]['password'] ?? '';
                }

                $username = $email;
                $password = wp_generate_password(12, true, true);
                $auto = true;

                $userpass_mode = isset($this->settings['waiting_userpass']) ? $this->settings['waiting_userpass'] : 'auto';

                if ($userpass_mode === 'manual') {
                    if (isset($args['username']) and trim($args['username'])) $username = $args['username'];
                    if (isset($args['password']) and trim($args['password'])) {
                        $password = $args['password'];
                        $auto = false;
                    }
                }

                if (! validate_username($username)) {
                    $username = 'user-' . mt_rand(100000000, 999999999999);
                    while (username_exists($username)) {
                        $username = 'user-' . mt_rand(100000000, 999999999999);
                    }
                }

                $user_id = $this->main->register_user($username, $email, $password, $auto);

                $user = new stdClass();
                $user->ID = $user_id;
                $user->first_name = $first_name;
                $user->last_name = $last_name;

                wp_update_user($user);
                update_user_meta($user_id, 'mec_name', $name);
                update_user_meta($user_id, 'mec_reg', $reg);
                update_user_meta($user_id, 'nickname', $name);

                // Map Data
                $event_id = $args['event_id'] ?? 0;
                if ($event_id) $this->save_mapped_data($event_id, $user_id, $reg);

                // Set the User Role
                $source = $args['source'] ?? 'booking';
                if ($source === 'waiting') {
                    $role = 'subscriber';
                } else {
                    $role = (isset($this->settings['booking_user_role']) && trim($this->settings['booking_user_role']))
                        ? $this->settings['booking_user_role'] : 'subscriber';
                }
                $wpuser = new WP_User($user_id);
                $wpuser->set_role($role);
            }
        }

        return $user_id;
    }

    public function save_mapped_data($event_id, $user_id, $reg)
    {
        $reg_fields = $this->main->get_reg_fields($event_id);

        foreach ($reg as $reg_id => $reg_value) {
            $reg_field = $reg_fields[$reg_id] ?? [];
            if (isset($reg_field['mapping']) and trim($reg_field['mapping'])) {
                $reg_value = maybe_unserialize($reg_value);
                $meta_value = is_array($reg_value) ? implode(',', $reg_value) : $reg_value;

                update_user_meta($user_id, $reg_field['mapping'], $meta_value);
            }
        }
    }

    public function assign($booking_id, $user_id)
    {
        // Registration is disabled
        if (isset($this->settings['booking_registration']) and !$this->settings['booking_registration'] and !get_user_by('ID', $user_id)) update_post_meta($booking_id, 'mec_user_id', $user_id);
        else update_post_meta($booking_id, 'mec_user_id', 'wp');
    }

    public function get($id)
    {
        // Registration is disabled
        if (isset($this->settings['booking_registration']) and !$this->settings['booking_registration']) {
            $user = $this->mec($id);
            if (!$user) $user = $this->wp($id);
        } else {
            $user = $this->wp($id);
            if (!$user) $user = $this->mec($id);
        }

        return $user;
    }

    public function mec($id)
    {
        $data = $this->db->select("SELECT * FROM `#__mec_users` WHERE `id`=" . ((int) $id), 'loadObject');
        if (!$data) return NULL;

        $user = new stdClass();
        $user->ID = $data->id;
        $user->first_name = stripslashes($data->first_name);
        $user->last_name = stripslashes($data->last_name);
        $user->display_name = trim(stripslashes($data->first_name) . ' ' . stripslashes($data->last_name));
        $user->email = $data->email;
        $user->user_email = $data->email;
        $user->user_registered = $data->created_at;
        $user->data = $user;

        return $user;
    }

    public function wp($id)
    {
        return get_userdata($id);
    }

    public function booking($id)
    {
        $mec_user_id = get_post_meta($id, 'mec_user_id', true);
        if (trim($mec_user_id) and is_numeric($mec_user_id)) return $this->mec($mec_user_id);

        return $this->wp(get_post($id)->post_author);
    }

    public function by_email($email)
    {
        return $this->get($this->id('email', $email));
    }

    public function id($field, $value)
    {
        $id = NULL;

        // Registration is disabled
        if (isset($this->settings['booking_registration']) and !$this->settings['booking_registration']) {
            $id = $this->db->select("SELECT `id` FROM `#__mec_users` WHERE `" . $field . "`='" . $this->db->escape($value) . "'", 'loadResult');
            if (!$id) {
                $user = get_user_by($field, $value);
                if (isset($user->ID)) $id = $user->ID;
            }
        } else {
            $user = get_user_by($field, $value);
            if (isset($user->ID)) $id = $user->ID;

            if (!$id) $id = $this->db->select("SELECT `id` FROM `#__mec_users` WHERE `" . $field . "`='" . $this->db->escape($value) . "'", 'loadResult');
        }

        return $id;
    }
}
