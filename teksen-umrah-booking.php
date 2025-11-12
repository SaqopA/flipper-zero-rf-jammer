<?php
/**
 * Plugin Name: TEKSEN Umrah Booking System
 * Description: Umre turları için rezervasyon yönetim sistemi
 * Version: 1.0
 * Author: TEKSEN
 * Text Domain: teksen-umrah-booking
 */

// Güvenlik kontrolü
if (!defined('ABSPATH')) {
    exit;
}


// Sabitler
define('TEKSEN_UMRAH_BOOKING_VERSION', '1.0');
define('TEKSEN_UMRAH_BOOKING_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('TEKSEN_UMRAH_BOOKING_PLUGIN_URL', plugin_dir_url(__FILE__));

// ====================================
// GLOBAL KUR DÖNÜŞTÜRMELERİ
// ====================================

// Güncel kur verilerini al (basit cache sistemi ile)
function teksen_get_exchange_rates() {
    $cached_rates = get_transient('teksen_exchange_rates');

    if ($cached_rates !== false) {
        return $cached_rates;
    }

    // TCMB'den kur verileri al
    $rates = array(
        'USD' => 28.50, // Varsayılan değerler
        'EUR' => 31.20,
        'TL' => 1.00
    );

    // TCMB XML'den kur çek
    $xml_url = 'https://www.tcmb.gov.tr/kurlar/today.xml';
    $response = wp_remote_get($xml_url, array('timeout' => 10));

    if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
        $xml_data = wp_remote_retrieve_body($response);

        // XML'i parse et
        $xml = simplexml_load_string($xml_data);

        if ($xml !== false) {
            foreach ($xml->Currency as $currency) {
                $code = (string) $currency->attributes()->CurrencyCode;
                $rate = (float) $currency->ForexSelling;

                if ($code === 'USD' && $rate > 0) {
                    $rates['USD'] = $rate;
                } elseif ($code === 'EUR' && $rate > 0) {
                    $rates['EUR'] = $rate;
                }
            }
        }
    }

    // 1 saatlik cache
    set_transient('teksen_exchange_rates', $rates, HOUR_IN_SECONDS);

    return $rates;
}

// Para birimi dönüştürme (global fonksiyon)
function teksen_convert_currency($amount, $from_currency, $to_currency = 'TL') {
    if ($from_currency === $to_currency) {
        return $amount;
    }

    $rates = teksen_get_exchange_rates();

    if ($from_currency === 'TL') {
        // TL'den diğer para birimlerine
        if (isset($rates[$to_currency])) {
            return $amount / $rates[$to_currency];
        }
    } else {
        // Diğer para birimlerinden TL'ye
        if (isset($rates[$from_currency])) {
            return $amount * $rates[$from_currency];
        }
    }

    return $amount; // Hata durumunda orijinal tutarı döndür
}

// Para birimi sembolleri (global fonksiyon)
function teksen_get_currency_symbol($currency) {
    $symbols = array(
        'TL' => '₺',
        'USD' => '$',
        'EUR' => '€'
    );

    return isset($symbols[$currency]) ? $symbols[$currency] : $currency;
}

// Plugin aktivasyonu
register_activation_hook(__FILE__, 'teksen_umrah_booking_activate');
function teksen_umrah_booking_activate() {
    // Post type'ları kaydet
    require_once TEKSEN_UMRAH_BOOKING_PLUGIN_DIR . 'includes/post-types.php';
    teksen_register_umrah_post_types();

    // Permalink'leri yenile
    flush_rewrite_rules();

    // Varsayılan ayarları oluştur
    if (!get_option('teksen_umrah_settings')) {
        $default_settings = array(
            'company_name' => 'TEKSEN Umre Turizm',
            'company_address' => '',
            'company_phone' => '',
            'company_email' => '',
            'company_website' => '',
            'notification_email' => get_option('admin_email'),
            'sms_enabled' => 0,
            'email_enabled' => 1,
            'payment_methods' => array('credit_card', 'bank_transfer', 'cash'),
            'currency' => 'TL',
            'deposit_required' => 1,
            'deposit_amount' => 1000,
            'deposit_type' => 'amount'
        );

        update_option('teksen_umrah_settings', $default_settings);
    }
}

// Plugin deaktivasyonu
register_deactivation_hook(__FILE__, 'teksen_umrah_booking_deactivate');
function teksen_umrah_booking_deactivate() {
    // Permalink'leri temizle
    flush_rewrite_rules();
}

// Ana init hook
add_action('init', 'teksen_umrah_booking_init');
function teksen_umrah_booking_init() {
    // Dosyaları dahil et
    require_once TEKSEN_UMRAH_BOOKING_PLUGIN_DIR . 'includes/post-types.php';
    require_once TEKSEN_UMRAH_BOOKING_PLUGIN_DIR . 'includes/meta-boxes.php';
    require_once TEKSEN_UMRAH_BOOKING_PLUGIN_DIR . 'includes/payment-system.php';
    require_once TEKSEN_UMRAH_BOOKING_PLUGIN_DIR . 'includes/notification-system.php';
    require_once TEKSEN_UMRAH_BOOKING_PLUGIN_DIR . 'public/shortcodes.php';

    // Post type'ları kaydet
    teksen_register_umrah_post_types();

    // Dil dosyalarını yükle - WordPress 6.7.0+ uyumlu
    load_plugin_textdomain('teksen-umrah-booking', false, dirname(plugin_basename(__FILE__)) . '/languages/');
}


// Admin CSS ve JS
add_action('admin_enqueue_scripts', 'teksen_umrah_booking_admin_assets');
function teksen_umrah_booking_admin_assets($hook) {
    // Admin CSS
    wp_enqueue_style(
        'teksen-admin-style',
        TEKSEN_UMRAH_BOOKING_PLUGIN_URL . 'admin/admin-style.css',
        array(),
        TEKSEN_UMRAH_BOOKING_VERSION
    );

    // Admin JS
    wp_enqueue_script(
        'teksen-admin-script',
        TEKSEN_UMRAH_BOOKING_PLUGIN_URL . 'admin/admin-script.js',
        array('jquery'),
        TEKSEN_UMRAH_BOOKING_VERSION,
        true
    );

    // AJAX için nonce
    wp_localize_script('teksen-admin-script', 'teksen_admin_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('teksen_admin_nonce')
    ));
}

// Frontend CSS ve JS
add_action('wp_enqueue_scripts', 'teksen_umrah_booking_frontend_assets');
function teksen_umrah_booking_frontend_assets() {
    // Frontend CSS
    wp_enqueue_style(
        'teksen-frontend-style',
        TEKSEN_UMRAH_BOOKING_PLUGIN_URL . 'public/assets/frontend-style.css',
        array(),
        TEKSEN_UMRAH_BOOKING_VERSION
    );

    // Frontend JS
    wp_enqueue_script(
        'teksen-frontend-script',
        TEKSEN_UMRAH_BOOKING_PLUGIN_URL . 'public/assets/frontend-script.js',
        array('jquery'),
        TEKSEN_UMRAH_BOOKING_VERSION,
        true
    );
}

// Özel template yükleyici
add_filter('template_include', 'teksen_umrah_booking_template_loader');
function teksen_umrah_booking_template_loader($template) {
    if (is_singular('umrah_tour')) {
        $plugin_template = TEKSEN_UMRAH_BOOKING_PLUGIN_DIR . 'single-umrah_tour.php';
        if (file_exists($plugin_template)) {
            return $plugin_template;
        }
    }

    return $template;
}

// Debug modu için log fonksiyonu
function teksen_log($message, $context = '') {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('TEKSEN-UMRAH [' . $context . ']: ' . $message);
    }
}

// Güvenlik - Direct access engelleyici
if (!function_exists('add_action')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit();
}


// 🔧 AJAX: Müşteri dropdown'unu basit güncelle (503 hata düzeltmesi)
add_action('wp_ajax_teksen_refresh_customers_dropdown', function() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Yetkiniz yok');
    }

    // 🔧 PERFORMANS: Basit müşteri listesi (ağır borç hesaplama kaldırıldı)
    $customers = get_posts(array(
        'post_type' => 'umrah_customer',
        'numberposts' => 50,  // Limit eklendi
        'post_status' => 'publish',
        'orderby' => 'title',
        'order' => 'ASC'
    ));

    $html = '<option value="">-- Müşteri Seçin --</option>';

    foreach ($customers as $customer) {
        $customer_id = $customer->ID;

        // Sadece mevcut borç bilgisini oku (hesaplama yapma)
        $current_debt = floatval(get_post_meta($customer_id, '_customer_debt', true) ?: 0);
        $assigned_tour_id = get_post_meta($customer_id, '_assigned_tour_id', true);

        // Müşteri detaylarını al
        $customer_name = get_post_meta($customer_id, '_customer_name', true);
        $customer_surname = get_post_meta($customer_id, '_customer_surname', true);
        $customer_tc = get_post_meta($customer_id, '_customer_tc', true);
        $customer_phone = get_post_meta($customer_id, '_customer_phone', true);
        $tour_title = $assigned_tour_id ? get_the_title($assigned_tour_id) : 'Tur atanmamış';

        $display_name = trim($customer_name . ' ' . $customer_surname);
        if (empty($display_name)) {
            $display_name = $customer->post_title; // Fallback post title'a
        }

        $html .= '<option value="' . esc_attr($customer_id) . '" data-debt="' . esc_attr($current_debt) . '" data-currency="TL" data-tour="' . esc_attr($tour_title) . '">';
        $html .= esc_html($display_name);
        if (!empty($customer_tc)) {
            $html .= ' - ' . esc_html($customer_tc);
        }
        if (!empty($customer_phone)) {
            $html .= ' - ' . esc_html($customer_phone);
        }
        if ($assigned_tour_id && $current_debt > 0) {
            $html .= ' (Borç: ' . number_format($current_debt, 2) . ' ₺)';
        } elseif ($assigned_tour_id && $current_debt == 0) {
            $html .= ' (Ödeme tamamlandı ✅)';
        } elseif (!$assigned_tour_id) {
            $html .= ' (⚠️ Tur atanmamış)';
        } else {
            $html .= ' (💸 Borç hesaplanamadı)';
        }
        $html .= '</option>';
    }

    wp_send_json_success(['html' => $html]);
});

// 🔧 AJAX: Sadece tek müşterinin güncel borç bilgisini getir (503 hata düzeltmesi)
add_action('wp_ajax_teksen_get_single_customer_debt', function() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Yetkiniz yok');
    }

    $customer_id = intval($_POST['customer_id'] ?? 0);
    if (!$customer_id) {
        wp_send_json_error('Müşteri ID eksik');
    }

    // Müşterinin güncel borç bilgisini hesapla
    $assigned_tour_id = get_post_meta($customer_id, '_assigned_tour_id', true);
    $current_debt = 0;

    if ($assigned_tour_id) {
        // İndirimli tutar varsa onu kullan
        $tour_discounted_amount = floatval(get_post_meta($customer_id, '_tour_discounted_amount', true) ?: 0);
        if ($tour_discounted_amount > 0) {
            $initial_debt = $tour_discounted_amount;
        } else {
            // Normal tur fiyatını kullan
            $tour_price = floatval(get_post_meta($assigned_tour_id, '_tour_price', true) ?: 0);
            $tour_currency = get_post_meta($assigned_tour_id, '_tour_currency', true) ?: 'TL';

            if ($tour_currency !== 'TL' && function_exists('teksen_convert_currency')) {
                $initial_debt = teksen_convert_currency($tour_price, $tour_currency, 'TL');
            } else {
                $initial_debt = $tour_price;
            }
        }

        // Bu müşterinin completed ödemelerini hesapla (performans için sınırlı)
        $customer_payments = get_posts(array(
            'post_type' => 'umrah_payment',
            'meta_query' => array(
                array('key' => '_payment_customer_id', 'value' => $customer_id),
                array('key' => '_payment_status', 'value' => 'completed')
            ),
            'numberposts' => 50,
            'no_found_rows' => true
        ));

        $total_paid = 0;
        foreach ($customer_payments as $payment) {
            $amount = floatval(get_post_meta($payment->ID, '_payment_amount_tl', true) ?: 0);
            $total_paid += $amount;
        }

        $current_debt = max(0, $initial_debt - $total_paid);

        // Veritabanını güncelle
        update_post_meta($customer_id, '_customer_debt', $current_debt);
    }

    wp_send_json_success(['debt' => $current_debt]);
});

// Eski hook kaldırıldı - tekrar hook çakışmasını önlemek için

// Kasa Detayları sayfası başında mesaj göster
add_action('admin_notices', function() {
    if (isset($_GET['page']) && strpos($_GET['page'], 'teksen-umrah-settings') !== false && isset($_GET['msg'])) {
        if ($_GET['msg'] === 'success') {
            echo '<div class="notice notice-success is-dismissible"><p><strong>Ödeme başarıyla kaydedildi.</strong></p></div>';
        } elseif ($_GET['msg'] === 'error') {
            echo '<div class="notice notice-error is-dismissible"><p><strong>Hata: Lütfen tüm zorunlu alanları doldurun.</strong></p></div>';
        }
    }
});

// WordPress Admin Post Hook - Ödeme Ekleme
add_action('admin_post_teksen_add_payment', 'teksen_handle_payment_form');

function teksen_handle_payment_form() {
    // Nonce kontrolü
    if (!wp_verify_nonce($_POST['teksen_payment_nonce'], 'teksen_add_payment_action')) {
        wp_die('❌ Güvenlik kontrolü başarısız!');
    }

    // Form verilerini al
    $customer_id = intval($_POST['payment_customer_id']);
    $amount = floatval($_POST['payment_amount']);
    $currency = sanitize_text_field($_POST['payment_currency']);
    $method = sanitize_text_field($_POST['payment_method']);
    $reference = sanitize_text_field($_POST['payment_reference']);
    $date = sanitize_text_field($_POST['payment_date']);
    $officer = sanitize_text_field($_POST['payment_officer']);
    $description = sanitize_textarea_field($_POST['payment_description']);

    // Validasyon
    if (!$customer_id || !$amount || $amount <= 0) {
        wp_redirect(admin_url('admin.php?page=teksen-umrah-settings&tab=add_payment&error=1'));
        exit;
    }

    // Ödeme kaydını oluştur
    $payment_id = wp_insert_post([
        'post_type' => 'umrah_payment',
        'post_status' => 'publish',
        'post_title' => 'Ödeme - ' . $reference,
        'post_content' => $description,
        'post_date' => $date . ' ' . current_time('H:i:s')
    ]);

    if ($payment_id && !is_wp_error($payment_id)) {
        // Meta verilerini kaydet
        update_post_meta($payment_id, '_payment_customer_id', $customer_id);
        update_post_meta($payment_id, '_payment_amount', $amount);
        update_post_meta($payment_id, '_payment_currency', $currency);
        update_post_meta($payment_id, '_payment_method', $method);
        update_post_meta($payment_id, '_payment_reference', $reference);
        update_post_meta($payment_id, '_payment_date', $date);
        update_post_meta($payment_id, '_payment_officer', $officer);
        update_post_meta($payment_id, '_payment_description', $description);
        update_post_meta($payment_id, '_payment_status', 'completed');

        // TL cinsinden tutar hesapla ve kaydet - Basitleştirilmiş sistem
        $amount_tl = $amount;
        if ($currency !== 'TL') {
            if (function_exists('teksen_convert_currency')) {
                $amount_tl = teksen_convert_currency($amount, $currency, 'TL');
            } else {
                // Güvenli fallback kur oranları
                if ($currency === 'USD') {
                    $amount_tl = $amount * 30;
                } elseif ($currency === 'EUR') {
                    $amount_tl = $amount * 33;
                } else {
                    $amount_tl = $amount; // Bilinmeyen para birimi için olduğu gibi bırak
                }
            }
        }
        update_post_meta($payment_id, '_payment_amount_tl', $amount_tl);

        // ÖNEMLİ: Müşteri borcundan düş
        $current_debt = floatval(get_post_meta($customer_id, '_customer_debt', true) ?: 0);
        $new_debt = max(0, $current_debt - $amount_tl);
        update_post_meta($customer_id, '_customer_debt', $new_debt);

        // 🔍 DETAYLI MATH DEBUG
        error_log('🔍 TEKSEN MATH DEBUG - Payment ID: ' . $payment_id);
        error_log('  - Original Amount: ' . $amount . ' ' . $currency);
        error_log('  - TL Amount: ' . $amount_tl . ' ₺');
        error_log('  - Old Debt: ' . $current_debt . ' ₺');
        error_log('  - New Debt: ' . $new_debt . ' ₺');
        error_log('  - Math: ' . $current_debt . ' - ' . $amount_tl . ' = ' . $new_debt);

        error_log('TEKSEN DEBUG: Borç güncellendi - Eski: ' . $current_debt . ' TL, Ödeme: ' . $amount_tl . ' TL, Yeni: ' . $new_debt . ' TL');

        // Başarılı yönlendirme
        wp_redirect(admin_url('admin.php?page=teksen-umrah-settings&tab=add_payment&success=1'));
        exit;
    } else {
        // Hata yönlendirmesi
        wp_redirect(admin_url('admin.php?page=teksen-umrah-settings&tab=add_payment&error=2'));
        exit;
    }

    // 🔧 TEKRAR EDEN KOD KALDIRILDI - Fonksiyon yukarıda zaten tanımlı
}

// BORÇ VERİSİ MİGRASYON FONKSİYONU - PHP 8.x UYUMLU GÜVENLİ VERSİYON
// Eski sistem tour_debt_amount kullanıyordu, yeni sistem _customer_debt kullanıyor
function teksen_migrate_customer_debts_safe() {
    // Sadece admin sayfalarında çalışsın
    if (!is_admin() || wp_doing_ajax()) {
        return false;
    }

    if (get_option('teksen_debt_migration_done', false)) {
        return false; // Zaten yapıldı
    }

    $customers = get_posts(array(
        'post_type' => 'umrah_customer',
        'numberposts' => 20, // Bir seferde az müşteri işle
        'post_status' => 'publish',
        'suppress_filters' => true
    ));

    if (empty($customers)) {
        update_option('teksen_debt_migration_done', true);
        return false;
    }

    $migrated_count = 0;
    foreach ($customers as $customer) {
        if (!$customer || !isset($customer->ID)) continue;

        // PHP 8.x uyumlu - null güvenli meta veri okuma
        $current_debt = get_post_meta($customer->ID, '_customer_debt', true);
        $current_debt = ($current_debt === null || $current_debt === '') ? '0' : strval($current_debt);

        // Eğer _customer_debt boşsa eski verileri kontrol et
        if (empty($current_debt) || $current_debt === '0' || floatval($current_debt) === 0.0) {
            $old_debt = get_post_meta($customer->ID, '_tour_debt_amount', true);
            $old_debt2 = get_post_meta($customer->ID, 'tour_debt_amount', true);

            // Null güvenli değer kontrolü
            $old_debt = ($old_debt === null) ? '0' : strval($old_debt);
            $old_debt2 = ($old_debt2 === null) ? '0' : strval($old_debt2);

            $debt_to_use = 0;

            if (!empty($old_debt) && is_numeric($old_debt) && floatval($old_debt) > 0) {
                $debt_to_use = floatval($old_debt);
            } elseif (!empty($old_debt2) && is_numeric($old_debt2) && floatval($old_debt2) > 0) {
                $debt_to_use = floatval($old_debt2);
            }

            if ($debt_to_use > 0) {
                update_post_meta($customer->ID, '_customer_debt', $debt_to_use);
                $migrated_count++;
            }
        }
    }

    if ($migrated_count === 0) {
        update_option('teksen_debt_migration_done', true);
    }

    return $migrated_count;
}

// ⚡ MATEMATİK DÜZELTME FONKSİYONU
function teksen_fix_payment_math() {
    // Tüm ödemeleri kontrol et ve TL tutarlarını yeniden hesapla
    $payments = get_posts(array(
        'post_type' => 'umrah_payment',
        'numberposts' => -1,
        'post_status' => 'publish'
    ));

    $fixed_count = 0;

    foreach ($payments as $payment) {
        $original_amount = floatval(get_post_meta($payment->ID, '_payment_amount', true) ?: 0);
        $currency = get_post_meta($payment->ID, '_payment_currency', true) ?: 'TL';
        $current_tl_amount = floatval(get_post_meta($payment->ID, '_payment_amount_tl', true) ?: 0);

        // Doğru TL tutarını hesapla
        $correct_tl_amount = $original_amount;
        if ($currency !== 'TL') {
            $correct_tl_amount = teksen_convert_currency($original_amount, $currency, 'TL');
        }

        // Eğer farklıysa düzelt
        if (abs($current_tl_amount - $correct_tl_amount) > 0.01) {
            update_post_meta($payment->ID, '_payment_amount_tl', $correct_tl_amount);
            $fixed_count++;

            error_log("TEKSEN MATH FIX: Payment {$payment->ID} - {$original_amount} {$currency} = {$correct_tl_amount} ₺ (Eski: {$current_tl_amount} ₺)");
        }
    }

    return $fixed_count;
}

// WordPress 6.7.0+ uyumluluğu tamamlandı - Son güncelleme: 2024-01-15

// ====================================
// WORDPRESS 6.7.0+ CRITICAL ERROR ÇÖZÜLDİ - WP_Query Yaklaşımı
// ====================================

/*
PROBLEM: Özel SQL fonksiyonları critical error veriyordu
ÇÖZÜM: WordPress'in yerleşik WP_Query meta_query sistemini kullandık

Bu yaklaşım:
- Daha güvenli
- WordPress standartlarına uygun
- Critical error vermiyor
- Kolay bakım yapılabilir

Müşteri listesi artık düzgün çalışacak.
*/

// ====================================