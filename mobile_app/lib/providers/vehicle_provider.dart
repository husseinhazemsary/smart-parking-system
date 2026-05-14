import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/vehicle_model.dart';
import '../services/vehicle_service.dart';

class VehicleProvider extends ChangeNotifier {
  List<VehicleModel> _vehicles = [];
  bool _isLoading = false;
  String? _error;

  List<VehicleModel> get vehicles => _vehicles;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void onAuthChanged(bool isAuthenticated) {
    if (isAuthenticated) {
      fetchVehicles();
    } else {
      _vehicles = [];
      notifyListeners();
    }
  }

  Future<void> fetchVehicles() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _vehicles = await VehicleService.getVehicles();
    } catch (e) {
      _error = _parseError(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addVehicle({
    required String plateNumber,
    String? nickname,
    required String vehicleType,
    String? makeAndModel,
    required bool isDefault,
    required bool autoPay,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final vehicle = await VehicleService.addVehicle(
        plateNumber: plateNumber,
        nickname: nickname,
        vehicleType: vehicleType,
        makeAndModel: makeAndModel,
        isDefault: isDefault,
        autoPay: autoPay,
      );
      // If the new vehicle is default, unmark all others locally.
      if (isDefault) {
        _vehicles = _vehicles.map((v) => v.copyWith(isDefault: false)).toList();
      }
      _vehicles = [..._vehicles, vehicle];
      return true;
    } catch (e) {
      _error = _parseError(e);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateVehicle({
    required String id,
    required String plateNumber,
    String? nickname,
    required String vehicleType,
    String? makeAndModel,
    required bool isDefault,
    required bool autoPay,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final updated = await VehicleService.updateVehicle(
        id: id,
        plateNumber: plateNumber,
        nickname: nickname,
        vehicleType: vehicleType,
        makeAndModel: makeAndModel,
        isDefault: isDefault,
        autoPay: autoPay,
      );
      if (isDefault) {
        _vehicles = _vehicles.map((v) => v.copyWith(isDefault: false)).toList();
      }
      _vehicles = _vehicles.map((v) => v.id == id ? updated : v).toList();
      return true;
    } catch (e) {
      _error = _parseError(e);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteVehicle(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await VehicleService.deleteVehicle(id);
      _vehicles = _vehicles.where((v) => v.id != id).toList();
      return true;
    } catch (e) {
      _error = _parseError(e);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  String _parseError(dynamic e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) return data['message'] as String;
      switch (e.response?.statusCode) {
        case 400:
          return 'Please check your input and try again.';
        case 404:
          return 'Vehicle not found.';
        case 409:
          return 'A vehicle with this plate number already exists.';
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        return 'Cannot connect to server. Make sure the backend is running.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
