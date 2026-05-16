import 'package:dio/dio.dart';
import '../models/parking_lot_model.dart';
import '../models/parking_slot_model.dart';
import 'api_client.dart';

class ParkingService {
  static final Dio _dio = ApiClient.instance;

  static Future<List<ParkingLotSummary>> getAllLots({
    double? lat,
    double? lng,
  }) async {
    final response = await _dio.get(
      '/parking-lots',
      queryParameters: {
        'lat': lat,
        'lng': lng,
      }..removeWhere((_, v) => v == null),
    );
    return (response.data as List)
        .map((e) => ParkingLotSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<ParkingLotDetail> getLotDetail(String id) async {
    final response = await _dio.get('/parking-lots/$id');
    return ParkingLotDetail.fromJson(response.data as Map<String, dynamic>);
  }

  static Future<List<ParkingSlotModel>> getLotSlots(String id) async {
    final response = await _dio.get('/parking-lots/$id/slots');
    return (response.data as List)
        .map((e) => ParkingSlotModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<SubscriptionPlan>> getSubscriptionPlans(String id) async {
    final response = await _dio.get('/parking-lots/$id/subscriptions');
    return (response.data as List)
        .map((e) => SubscriptionPlan.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
