import 'package:dio/dio.dart';
import 'api_client.dart';

class AuthService {
  static final Dio _dio = ApiClient.instance;

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return response.data as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String dateOfBirth,
    required String password,
  }) async {
    final response = await _dio.post('/auth/register', data: {
      'fullName': fullName,
      'email': email,
      'phoneNumber': phoneNumber,
      'dateOfBirth': dateOfBirth,
      'password': password,
    });
    return response.data as Map<String, dynamic>;
  }

  static Future<void> logout(String refreshToken) async {
    await _dio.post('/auth/logout', data: {'refreshToken': refreshToken});
  }

  static Future<Map<String, dynamic>> refresh(String refreshToken) async {
    final response = await _dio.post('/auth/refresh', data: {
      'refreshToken': refreshToken,
    });
    return response.data as Map<String, dynamic>;
  }

  static Future<void> forgotPassword(String email) async {
    await _dio.post('/auth/forgot-password', data: {'email': email});
  }

  static Future<void> resendVerification(String email) async {
    await _dio.post('/auth/resend-verification', data: {'email': email});
  }

  static Future<Map<String, dynamic>> verifyEmail(
      String email, String code) async {
    final response = await _dio.post('/auth/verify-email',
        data: {'email': email, 'code': code});
    return response.data as Map<String, dynamic>;
  }

  static Future<void> resetPassword(
      String email, String code, String newPassword) async {
    await _dio.post('/auth/reset-password',
        data: {'email': email, 'code': code, 'newPassword': newPassword});
  }
}
