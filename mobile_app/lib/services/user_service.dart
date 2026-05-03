import 'package:dio/dio.dart';
import '../models/user_model.dart';
import 'api_client.dart';

class UserService {
  static final Dio _dio = ApiClient.instance;

  static Future<UserModel> getProfile() async {
    final response = await _dio.get('/users/me');
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  static Future<UserModel> updateProfile({
    required String fullName,
    required String phoneNumber,
    required String dateOfBirth, // ISO format: YYYY-MM-DD
  }) async {
    final response = await _dio.put('/users/me', data: {
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'dateOfBirth': dateOfBirth,
    });
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  static Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _dio.put('/users/me/password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }
}
