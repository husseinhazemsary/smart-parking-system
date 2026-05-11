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
    required String dateOfBirth, // ISO format: YYYY-MM-DD
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
}
