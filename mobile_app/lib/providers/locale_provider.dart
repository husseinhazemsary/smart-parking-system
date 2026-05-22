import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleProvider extends ChangeNotifier {
  static const _key = 'locale_arabic';

  Locale _locale = const Locale('en');

  Locale get locale => _locale;
  bool get isArabic => _locale.languageCode == 'ar';

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final savedArabic = prefs.getBool(_key);
    if (savedArabic != null) {
      _locale = savedArabic ? const Locale('ar') : const Locale('en');
      notifyListeners();
    }
  }

  Future<void> toggleLocale() async {
    _locale = isArabic ? const Locale('en') : const Locale('ar');
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, isArabic);
  }
}
