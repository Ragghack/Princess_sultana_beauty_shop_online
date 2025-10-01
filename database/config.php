<?php
// Database configuration
$db_host = 'localhost';
$db_name = 'huile_de_chebe';
$db_user = 'root';
$db_pass = '';

// Create connection
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>