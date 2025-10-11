<?php
/**
 * Plugin Name: MEC API Bridge (Minimal)
 * Description: Exposes MEC events via REST API (events only, no bookings)
 * Version: 1.0.1
 * Author: MEC Events App
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class MEC_API_Bridge_Minimal {
    
    public function __construct() {
        // Register REST API routes
        add_action('rest_api_init', array($this, 'register_rest_routes'));
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
    }
    
    public function get_events_with_metadata($request) {
        $per_page = $request->get_param('per_page');
        $per_page = $per_page ? $per_page : 100;
        
        $page = $request->get_param('page');
        $page = $page ? $page : 1;
        
        $start_date = $request->get_param('start_date');
        $end_date = $request->get_param('end_date');
        
        $args = array(
            'post_type' => 'mec-events',
            'post_status' => 'publish',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'modified',
            'order' => 'DESC'
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
        
        // Calculate timestamps if we have the datetime
        $start_timestamp = null;
        if ($mec_start_datetime) {
            $start_timestamp = strtotime($mec_start_datetime);
        } elseif ($mec_start_date) {
            $start_timestamp = strtotime($mec_start_date);
        }
        
        $end_timestamp = null;
        if ($mec_end_datetime) {
            $end_timestamp = strtotime($mec_end_datetime);
        } elseif ($mec_end_date) {
            $end_timestamp = strtotime($mec_end_date);
        }
        
        // Get featured image
        $thumbnail_id = get_post_thumbnail_id($post_id);
        $thumbnail_url = '';
        if ($thumbnail_id) {
            $thumbnail_url = wp_get_attachment_image_url($thumbnail_id, 'full');
        }
        
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
}

// Initialize the plugin
new MEC_API_Bridge_Minimal();

