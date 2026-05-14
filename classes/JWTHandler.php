<?php
// JWT Handler untuk autentikasi
class JWTHandler {
    private static $secret = JWT_SECRET;
    private static $alg = 'HS256';
    
    /**
     * Encode JWT Token
     */
    public static function encode($data, $exp = 86400) { // default 24 jam
        $header = [
            'alg' => self::$alg,
            'typ' => 'JWT'
        ];
        
        $payload = array_merge($data, [
            'iat' => time(),
            'exp' => time() + $exp
        ]);
        
        $header_encoded = self::base64url_encode(json_encode($header));
        $payload_encoded = self::base64url_encode(json_encode($payload));
        
        $signature = hash_hmac(
            'sha256',
            "$header_encoded.$payload_encoded",
            self::$secret,
            true
        );
        $signature_encoded = self::base64url_encode($signature);
        
        return "$header_encoded.$payload_encoded.$signature_encoded";
    }
    
    /**
     * Decode JWT Token
     */
    public static function decode($token) {
        $parts = explode('.', $token);
        
        if (count($parts) != 3) {
            return false;
        }
        
        $header = json_decode(self::base64url_decode($parts[0]), true);
        $payload = json_decode(self::base64url_decode($parts[1]), true);
        $signature = $parts[2];
        
        // Verify signature
        $signature_check = hash_hmac(
            'sha256',
            "$parts[0].$parts[1]",
            self::$secret,
            true
        );
        $signature_check_encoded = self::base64url_encode($signature_check);
        
        if ($signature !== $signature_check_encoded) {
            return false;
        }
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
    
    /**
     * Base64 URL Encode
     */
    private static function base64url_encode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }
    
    /**
     * Base64 URL Decode
     */
    private static function base64url_decode($data) {
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }
}
?>
