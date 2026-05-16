import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../models/parking_lot_model.dart';
import '../models/parking_slot_model.dart';
import '../services/parking_service.dart';

class ParkingProvider extends ChangeNotifier {
  List<ParkingLotSummary> _lots = [];
  final Map<String, ParkingLotDetail> _details = {};
  final Map<String, List<ParkingSlotModel>> _slots = {};

  bool _isLoadingLots = false;
  final Set<String> _loadingDetails = {};
  final Set<String> _loadingSlots = {};

  String? _lotsError;
  final Map<String, String> _detailErrors = {};
  final Map<String, String> _slotErrors = {};

  // ── Lots ──────────────────────────────────────────────────────────────────

  List<ParkingLotSummary> get lots => _lots;
  bool get isLoadingLots => _isLoadingLots;
  String? get lotsError => _lotsError;

  Future<void> fetchLots({double? lat, double? lng}) async {
    if (_isLoadingLots) return;
    _isLoadingLots = true;
    _lotsError = null;
    notifyListeners();
    try {
      _lots = await ParkingService.getAllLots(lat: lat, lng: lng);
    } catch (e) {
      _lotsError = _msg(e);
    } finally {
      _isLoadingLots = false;
      notifyListeners();
    }
  }

  // Re-fetches even if a previous fetch already completed, used when
  // location becomes available after the initial load.
  Future<void> refreshLotsWithLocation(double lat, double lng) async {
    _isLoadingLots = true;
    notifyListeners();
    try {
      _lots = await ParkingService.getAllLots(lat: lat, lng: lng);
    } catch (e) {
      _lotsError = _msg(e);
    } finally {
      _isLoadingLots = false;
      notifyListeners();
    }
  }

  // ── Detail ────────────────────────────────────────────────────────────────

  ParkingLotDetail? detailFor(String id) => _details[id];
  bool isLoadingDetail(String id) => _loadingDetails.contains(id);
  String? detailError(String id) => _detailErrors[id];

  Future<void> fetchDetail(String id) async {
    if (_loadingDetails.contains(id)) return;
    _loadingDetails.add(id);
    _detailErrors.remove(id);
    notifyListeners();
    try {
      _details[id] = await ParkingService.getLotDetail(id);
    } catch (e) {
      _detailErrors[id] = _msg(e);
    } finally {
      _loadingDetails.remove(id);
      notifyListeners();
    }
  }

  // ── Slots ─────────────────────────────────────────────────────────────────

  List<ParkingSlotModel>? slotsFor(String id) => _slots[id];
  bool isLoadingSlots(String id) => _loadingSlots.contains(id);
  String? slotError(String id) => _slotErrors[id];

  Future<void> fetchSlots(String id) async {
    if (_loadingSlots.contains(id)) return;
    _loadingSlots.add(id);
    _slotErrors.remove(id);
    notifyListeners();
    try {
      _slots[id] = await ParkingService.getLotSlots(id);
    } catch (e) {
      _slotErrors[id] = _msg(e);
    } finally {
      _loadingSlots.remove(id);
      notifyListeners();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  String _msg(dynamic e) {
    if (e is DioException) {
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
