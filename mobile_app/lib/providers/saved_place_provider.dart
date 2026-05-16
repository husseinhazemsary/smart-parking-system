import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/saved_place_model.dart';
import '../services/saved_place_service.dart';

class SavedPlaceProvider extends ChangeNotifier {
  List<SavedPlaceModel> _places = [];
  bool _isLoading = false;
  String? _error;

  List<SavedPlaceModel> get places => _places;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void onAuthChanged(bool isAuthenticated) {
    if (isAuthenticated) {
      fetchSavedPlaces();
    } else {
      _places = [];
      notifyListeners();
    }
  }

  Future<void> fetchSavedPlaces() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _places = await SavedPlaceService.getSavedPlaces();
    } catch (e) {
      _error = _parseError(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> savePlace(String parkingLotId) async {
    _error = null;
    try {
      final place = await SavedPlaceService.savePlace(parkingLotId);
      _places = [place, ..._places];
      notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> removePlace(String id) async {
    _error = null;
    try {
      await SavedPlaceService.removePlace(id);
      _places = _places.where((p) => p.id != id).toList();
      notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e);
      notifyListeners();
      return false;
    }
  }

  String _parseError(dynamic e) {
    if (e is DioException) {
      final status = e.response?.statusCode;
      if (status == 401 || status == 403) return 'Please log in to save parking lots.';
      if (status == 409) return 'This parking lot is already saved.';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) return data['message'] as String;
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        return 'Cannot connect to server. Make sure the backend is running.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}
