import 'dart:io';
import 'package:dio/dio.dart';
import 'api_client.dart';

class PlateScanService {
  static Future<String?> scanPlate(File imageFile) async {
    try {
      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(
          imageFile.path,
          filename: 'plate.jpg',
        ),
      });

      final response = await ApiClient.instance.post(
        '/plates/scan',
        data: formData,
      );

      final data = response.data;
      if (data is Map && data['valid'] == true && data['plate'] != null) {
        return data['plate'] as String;
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
