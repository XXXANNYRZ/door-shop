<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';

// Настройки SMTP
$smtpConfig = [
    'host' => 'smtp.yandex.ru',
    'username' => 'dimarj2005@yandex.ru',
    'password' => 'rekqpuwbyggfdgrg', // Пароль приложения Яндекса
    'port' => 465,
    'secure' => 'ssl',
    'timeout' => 15
];

// Логирование входящих данных
file_put_contents('debug.log', date('[Y-m-d H:i:s]')." - Новый запрос\n".print_r($_POST, true)."\n", FILE_APPEND);

// Заголовки
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

// Проверка метода
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Только POST-запросы']));
}

// Функция очистки данных
function cleanInput($data, $maxLength = 1000) {
    if (!isset($data)) return '';
    $data = trim($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return substr($data, 0, $maxLength);
}

try {
    // Подготовка данных
    $name = cleanInput($_POST['name'] ?? '', 100);
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $phone = preg_replace('/[^0-9+]/', '', $_POST['phone'] ?? '');
    $comment = str_replace(["\r\n", "\n", "\r"], ' ', cleanInput($_POST['comment'] ?? '', 2000));
    $formType = cleanInput($_POST['form_type'] ?? 'unknown');

    // Локальный режим для тестирования
    if ($_SERVER['HTTP_HOST'] === 'localhost') {
        file_put_contents('test_emails.log', 
            "Локальная отправка:\nТип: $formType\nИмя: $name\nТелефон: $phone\nEmail: $email\nКомментарий: $comment\n\n", 
            FILE_APPEND
        );
        echo json_encode(['success' => true, 'local_test' => true]);
        exit;
    }

    // Настройка PHPMailer
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $smtpConfig['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $smtpConfig['username'];
    $mail->Password = $smtpConfig['password'];
    $mail->SMTPSecure = $smtpConfig['secure'];
    $mail->Port = $smtpConfig['port'];
    $mail->Timeout = $smtpConfig['timeout'];
    $mail->CharSet = 'UTF-8';
    $mail->Encoding = 'base64';

    // Отправитель/получатель
    $mail->setFrom($smtpConfig['username'], 'Door Shop');
    $mail->addAddress('dimarj2005@gmail.com');

    // Тема письма
    $mail->Subject = "Новая заявка: $formType";

    // HTML-версия письма
    $mail->isHTML(true);
    $mail->Body = "
        <h2 style='color:#2c3e50;'>Новая заявка</h2>
        <div style='font-family:Arial,sans-serif;'>
            <p><strong style='color:#3498db;'>Тип формы:</strong> $formType</p>
            <p><strong style='color:#3498db;'>Имя:</strong> $name</p>
            " . ($phone ? "<p><strong style='color:#3498db;'>Телефон:</strong> $phone</p>" : "") . "
            " . ($email ? "<p><strong style='color:#3498db;'>Email:</strong> $email</p>" : "") . "
            " . ($comment ? "<p><strong style='color:#3498db;'>Комментарий:</strong><br>" . nl2br($comment) . "</p>" : "") . "
        </div>";

    // Текстовая версия для почтовых клиентов
    $mail->AltBody = "Новая заявка\n\n"
        . "Тип формы: $formType\n"
        . "Имя: $name\n"
        . ($phone ? "Телефон: $phone\n" : "")
        . ($email ? "Email: $email\n" : "")
        . ($comment ? "Комментарий:\n$comment" : "");

    // Дополнительные заголовки
    $mail->addCustomHeader('X-Priority', '1');
    $mail->addCustomHeader('X-Mailer', 'PHP Mailer');

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    // Логирование ошибки
    file_put_contents('smtp_errors.log', date('[Y-m-d H:i:s]')." - ".$e->getMessage()."\n", FILE_APPEND);
    
    // Резервное сохранение данных
    $backupData = [
        'date' => date('Y-m-d H:i:s'),
        'form_data' => [
            'name' => $name ?? '',
            'phone' => $phone ?? '',
            'email' => $email ?? '',
            'comment' => $comment ?? '',
            'form_type' => $formType ?? ''
        ],
        'error' => $e->getMessage()
    ];
    file_put_contents('backup_orders.json', json_encode($backupData, JSON_UNESCAPED_UNICODE)."\n", FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Ошибка отправки формы',
        'hint' => 'Мы сохранили ваши данные и свяжемся с вами',
        'debug' => (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false) ? $e->getMessage() : null
    ]);
}
?>