import 'package:dio/dio.dart';

/// Fetches car makes and models from the NHTSA public vehicle API.
/// Results are cached in memory for the lifetime of the app session.
class CarSearchService {
  static const _base = 'https://vpic.nhtsa.dot.gov/api/vehicles';

  static final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  static List<String>? _allMakes;
  static bool _fetchingMakes = false;
  static final Map<String, List<String>> _modelCache = {};

  /// Pre-fetch the full makes list. Call once on screen init.
  static Future<void> prefetchMakes() async {
    if (_allMakes != null || _fetchingMakes) return;
    _fetchingMakes = true;
    try {
      final resp = await _dio.get('$_base/getallmakes?format=json');
      final results = resp.data['Results'] as List;
      _allMakes = results
          .map((e) => (e['Make_Name'] as String).trim())
          .where((m) => m.isNotEmpty)
          .toList();
    } catch (_) {
      _allMakes = [];
    } finally {
      _fetchingMakes = false;
    }
  }

  static Future<List<String>> _modelsForMake(String make) async {
    final key = make.toLowerCase();
    if (_modelCache.containsKey(key)) return _modelCache[key]!;
    try {
      final resp = await _dio.get(
        '$_base/getmodelsformake/${Uri.encodeComponent(make)}?format=json',
      );
      final results = resp.data['Results'] as List;
      final models = results
          .map((e) => (e['Model_Name'] as String).trim())
          .where((m) => m.isNotEmpty)
          .toList();
      _modelCache[key] = models;
      return models;
    } catch (_) {
      return [];
    }
  }

  /// Returns the detected app vehicle type for a "Make Model" string.
  /// Returns null — type detection not yet implemented.
  static String? getVehicleType(String makeAndModel) => null;

  /// Returns up to 6 autocomplete suggestions for [query].
  ///
  /// - No space → filter makes by prefix  ("toy"     → "TOYOTA", …)
  /// - Space    → resolve make, fetch NHTSA models
  ///              ("TOYOTA "   → "TOYOTA 4Runner", "TOYOTA Camry", …)
  ///              ("TOYOTA co" → "TOYOTA Corolla", …)
  static Future<List<String>> getSuggestions(String query) async {
    // trimLeft only — preserve trailing space so "Toyota " enters model branch.
    final q = query.trimLeft();
    if (q.trim().isEmpty) return [];

    await prefetchMakes();
    final makes = _allMakes ?? [];

    final spaceIdx = q.indexOf(' ');

    if (spaceIdx == -1) {
      final lower = q.toLowerCase();
      return makes
          .where((m) => m.toLowerCase().startsWith(lower))
          .take(6)
          .toList();
    }

    final makePart = q.substring(0, spaceIdx);
    final modelPart = q.substring(spaceIdx + 1).trim().toLowerCase();
    final makeLower = makePart.toLowerCase();

    final matchedMake = makes.firstWhere(
      (m) => m.toLowerCase() == makeLower,
      orElse: () => makes.firstWhere(
        (m) => m.toLowerCase().startsWith(makeLower),
        orElse: () => '',
      ),
    );
    if (matchedMake.isEmpty) return [];

    final models = await _modelsForMake(matchedMake);
    return models
        .where((m) =>
            modelPart.isEmpty || m.toLowerCase().startsWith(modelPart))
        .take(6)
        .map((m) => '$matchedMake $m')
        .toList();
  }
}
