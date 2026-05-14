import 'package:dio/dio.dart';
import '../models/vehicle_model.dart';
import 'api_client.dart';

class VehicleService {
  static final Dio _dio = ApiClient.instance;

  static Future<List<VehicleModel>> getVehicles() async {
    final response = await _dio.get('/users/me/vehicles');
    return (response.data as List)
        .map((v) => VehicleModel.fromJson(v as Map<String, dynamic>))
        .toList();
  }

  static Future<VehicleModel> addVehicle({
    required String plateNumber,
    String? nickname,
    required String vehicleType,
    String? makeAndModel,
    required bool isDefault,
    required bool autoPay,
  }) async {
    final response = await _dio.post('/users/me/vehicles', data: {
      'plateNumber': plateNumber,
      'nickname': nickname,
      'vehicleType': vehicleType,
      'makeAndModel': makeAndModel,
      'isDefault': isDefault,
      'autoPay': autoPay,
    });
    return VehicleModel.fromJson(response.data as Map<String, dynamic>);
  }

  static Future<VehicleModel> updateVehicle({
    required String id,
    required String plateNumber,
    String? nickname,
    required String vehicleType,
    String? makeAndModel,
    required bool isDefault,
    required bool autoPay,
  }) async {
    final response = await _dio.put('/users/me/vehicles/$id', data: {
      'plateNumber': plateNumber,
      'nickname': nickname,
      'vehicleType': vehicleType,
      'makeAndModel': makeAndModel,
      'isDefault': isDefault,
      'autoPay': autoPay,
    });
    return VehicleModel.fromJson(response.data as Map<String, dynamic>);
  }

  static Future<void> deleteVehicle(String id) async {
    await _dio.delete('/users/me/vehicles/$id');
  }
}
