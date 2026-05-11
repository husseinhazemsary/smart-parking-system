import 'package:flutter/material.dart';

class UserPrefsProvider extends ChangeNotifier {
  bool _hasEV = false;

  bool get hasEV => _hasEV;

  void setHasEV(bool value) {
    _hasEV = value;
    notifyListeners();
  }
}
