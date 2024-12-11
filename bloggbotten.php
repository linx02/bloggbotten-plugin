<?php
/*
Plugin Name: BloggBotten
Plugin URI: https://bloggbotten.se
Description: BloggBotten skapar innehåll med hjälp av AI för din blogg.
Version: 1.0
Author: Linus Elvius
Author URI: https://linuselvius.com
License: GPL2
*/

// Prevent direct access to the file
if (!defined('ABSPATH')) {
    exit;
}

// Add the menu to the admin dashboard
function bloggbotten_add_dashboard_menu() {
    add_menu_page(
        'BloggBotten',
        'BloggBotten',
        'manage_options',
        'bloggbotten',
        'bloggbotten_dashboard_page',
        'dashicons-superhero',
        6
    );
}
add_action('admin_menu', 'bloggbotten_add_dashboard_menu');

// Enqueue CSS and JS for the plugin
function bloggbotten_enqueue_assets($hook) {
    if ($hook === 'toplevel_page_bloggbotten') {
        // Enqueue CSS
        wp_enqueue_style(
            'bloggbotten-dashboard-css',
            plugin_dir_url(__FILE__) . 'assets/css/dashboard.css',
            [],
            '1.0'
        );

        // Register main.js as a module
        wp_register_script(
            'bloggbotten-main-js',
            plugin_dir_url(__FILE__) . 'assets/js/main.js',
            [],
            '1.0',
            true
        );

        // Localize or pass data to the script as needed
        wp_localize_script('bloggbotten-main-js', 'bloggbottenData', [
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        // Enqueue the main.js script
        wp_enqueue_script('bloggbotten-main-js');

        // Add a filter to set type="module" on the script tag
        add_filter('script_loader_tag', 'bloggbotten_add_type_attribute', 10, 3);
    }
}
add_action('admin_enqueue_scripts', 'bloggbotten_enqueue_assets');

/**
 * Add type="module" to the main script tag.
 */
function bloggbotten_add_type_attribute($tag, $handle, $src) {
    if ('bloggbotten-main-js' === $handle) {
        // Add type="module"
        $tag = '<script type="module" src="' . esc_url($src) . '"></script>';
    }
    return $tag;
}

// Render the dashboard page
function bloggbotten_dashboard_page() {
    $html_path = plugin_dir_path(__FILE__) . 'assets/html/dashboard.html';

    if (file_exists($html_path)) {
        include $html_path;
    } else {
        echo '<div class="wrap"><h1>Error</h1><p>Dashboard file not found.</p></div>';
    }
}

// Encrypt sensitive data
function bloggbotten_encrypt_data($data) {
    $encryption_key = wp_salt(); // Use WordPress's secure salt
    return openssl_encrypt($data, 'aes-256-cbc', $encryption_key, 0, substr($encryption_key, 0, 16));
}

// Decrypt sensitive data
function bloggbotten_decrypt_data($encrypted_data) {
    $encryption_key = wp_salt();
    return openssl_decrypt($encrypted_data, 'aes-256-cbc', $encryption_key, 0, substr($encryption_key, 0, 16));
}

// Register REST API routes
add_action('rest_api_init', function () {
    // Save settings
    register_rest_route('bloggbotten/v1', '/settings', [
        'methods' => 'POST',
        'callback' => 'bloggbotten_save_settings',
        'permission_callback' => function () {
            return current_user_can('manage_options');
        },
    ]);

    // Load settings
    register_rest_route('bloggbotten/v1', '/settings', [
        'methods' => 'GET',
        'callback' => 'bloggbotten_load_settings',
        'permission_callback' => function () {
            return current_user_can('manage_options');
        },
    ]);

    register_rest_route('bloggbotten/v1', '/site-url', [
        'methods' => 'GET',
        'callback' => function () {
            return rest_ensure_response(['site_url' => get_site_url()]);
        },
        'permission_callback' => '__return_true', // No permission required for this route
    ]);

});

// Save settings to the database (with encryption for sensitive fields)
function bloggbotten_save_settings(WP_REST_Request $request) {
    $user_id = sanitize_text_field($request->get_param('user_id'));
    $auth_key = bloggbotten_encrypt_data(sanitize_text_field($request->get_param('auth_key')));
    $description = sanitize_textarea_field($request->get_param('description'));
    $keywords = sanitize_textarea_field($request->get_param('keywords'));

    // Handle the schedule
    $schedule = $request->get_param('schedule');
    if (is_array($schedule)) {
        $sanitized_schedule = [
            'time' => sanitize_text_field($schedule['time']),
            'days' => array_map('sanitize_text_field', $schedule['days'] ?? []),
        ];
        update_option('bloggbotten_schedule', $sanitized_schedule);
    }

    update_option('bloggbotten_user_id', $user_id);
    update_option('bloggbotten_auth_key', $auth_key);
    update_option('bloggbotten_description', $description);
    update_option('bloggbotten_keywords', $keywords);

    return rest_ensure_response(['success' => true]);
}

// Load settings from the database (with decryption for sensitive fields)
function bloggbotten_load_settings() {
    $settings = [
        'user_id' => get_option('bloggbotten_user_id', ''),
        'auth_key' => bloggbotten_decrypt_data(get_option('bloggbotten_auth_key', '')),
        'description' => get_option('bloggbotten_description', ''),
        'keywords' => get_option('bloggbotten_keywords', ''),
        'schedule' => get_option('bloggbotten_schedule', ['time' => '', 'days' => []]), // Include schedule
    ];

    return rest_ensure_response($settings);
}

function bloggbotten_save_titles(WP_REST_Request $request) {
    $titles = $request->get_param('titles');

    if (!is_array($titles) || empty($titles)) {
        return new WP_Error('invalid_data', 'Invalid or empty titles', ['status' => 400]);
    }

    update_option('bloggbotten_titles', $titles);

    return rest_ensure_response(['success' => true]);
}