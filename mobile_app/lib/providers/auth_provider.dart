import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  String? _accessToken;
  String? _refreshToken;
  String? _userName;
  String? _userEmail;
  String? _userId;
  bool _isLoading = false;
  String? _error;
  bool _initialized = false;

  bool get isAuthenticated => _accessToken != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  bool get initialized => _initialized;

  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Called once at startup — loads stored tokens from SharedPreferences.
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    _refreshToken = prefs.getString('refresh_token');
    _userName = prefs.getString('user_name');
    _userEmail = prefs.getString('user_email');
    _userId = prefs.getString('user_id');
    if (_accessToken != null) {
      ApiClient.setAuthToken(_accessToken!);
    }
    _initialized = true;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await AuthService.login(email, password);
      await _saveSession(data);
      return true;
    } catch (e) {
      _error = _parseError(e);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String dateOfBirth,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await AuthService.register(
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber,
        dateOfBirth: dateOfBirth,
        password: password,
      );
      await _saveSession(data);
      return true;
    } catch (e) {
      _error = _parseError(e);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    if (_refreshToken != null) {
      try {
        await AuthService.logout(_refreshToken!);
      } catch (_) {
        // Best-effort — still clear local session even if server call fails.
      }
    }
    await _clearSession();
  }

  Future<void> _saveSession(Map<String, dynamic> data) async {
    _accessToken = data['accessToken'] as String?;
    _refreshToken = data['refreshToken'] as String?;
    final user = data['user'] as Map<String, dynamic>?;
    _userName = user?['fullName'] as String?;
    _userEmail = user?['email'] as String?;
    _userId = user?['id'] as String?;

    ApiClient.setAuthToken(_accessToken!);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', _accessToken!);
    await prefs.setString('refresh_token', _refreshToken!);
    if (_userName != null) await prefs.setString('user_name', _userName!);
    if (_userEmail != null) await prefs.setString('user_email', _userEmail!);
    if (_userId != null) await prefs.setString('user_id', _userId!);

    notifyListeners();
  }

  Future<void> _clearSession() async {
    _accessToken = null;
    _refreshToken = null;
    _userName = null;
    _userEmail = null;
    _userId = null;
    ApiClient.clearAuthToken();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_name');
    await prefs.remove('user_email');
    await prefs.remove('user_id');

    notifyListeners();
  }

  String _parseError(dynamic e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) return data['message'] as String;
      switch (e.response?.statusCode) {
        case 401:
          return 'Invalid email or password.';
        case 409:
          return 'An account with this email already exists.';
        case 400:
          return 'Please check your details and try again.';
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        return 'Cannot connect to server. Make sure the backend is running.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
