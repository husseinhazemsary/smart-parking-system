import 'package:dio/dio.dart';
import '../models/saved_place_model.dart';
import 'api_client.dart';

class SavedPlaceService {
  static final Dio _dio = ApiClient.instance;

  static Future<List<SavedPlaceModel>> getSavedPlaces() async {
    final response = await _dio.get('/saved-places');
    return (response.data as List)
        .map((v) => SavedPlaceModel.fromJson(v as Map<String, dynamic>))
        .toList();
  }

  static Future<SavedPlaceModel> savePlace(String parkingLotId) async {
    final response = await _dio.post('/saved-places', data: {'parkingLotId': parkingLotId});
    return SavedPlaceModel.fromJson(response.data as Map<String, dynamic>);
  }

  static Future<void> removePlace(String id) async {
    await _dio.delete('/saved-places/$id');
  }
}
