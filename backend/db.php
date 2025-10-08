<?php
require "message_log.php"; // Para los mensajes de error

//INFO DB DIANA
$server = 'DIANAR\\MSSQLSERVER01'; //Servidor de base de datos
$db     = 'DianaAbrasivlog'; //Nombre de la base de datos

//INFO DB Camila
//$server = 'DESKTOP-7KHMCN1';
//$db     = 'Abrasivlog';

//INFO DB Valeria 
//$server = 'LAPTOP-VALERIA';
//$db     = 'Abrasivlog';

//INFO DB Jose
//$server = 'DESKTOP-LUIKLRP';
//$db     = 'Abrasivlog';


//Es una cadena de conexión con el servidor de base de datos, nombre de base de datos, con Encrypt=Yes para cifrar la comunicación y
//TrustServerCertificate=Yes para que conecte localmente con el usuario de windows
$dsn = "sqlsrv:Server=$server;Database=$db;Encrypt=Yes;TrustServerCertificate=Yes";


// Intenta conectarse a la base de datos
try {
    //Ejecuta la cadena de conexión
    $pdo = new PDO($dsn);
    //Establece el modo de error de PDO para lanzar excepciones
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    //Muestra un mensaje en la consola
    logDebug("Conexión exitosa con Windows Authentication");

} catch (PDOException $e) { // Si ocurre un error
    logError($e->getMessage()); // Muestra el mensaje de error
    die("Error de conexion: " . $e->getMessage()); // Termina el script con un mensaje de error
}