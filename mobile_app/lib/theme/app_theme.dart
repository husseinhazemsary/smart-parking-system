// Centralised theme definitions for dark and light modes.
// All widget defaults (buttons, inputs, checkboxes, appbar) are set here
// so individual screens stay free of repeated styling boilerplate.
import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  // Dark theme — used when ThemeProvider.isDark is true.
  static ThemeData get dark => ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.backgroundDark,
    colorScheme: const ColorScheme.dark(
      background: AppColors.backgroundDark,
      surface: AppColors.surfaceDark,
      primary: AppColors.purple,
      onPrimary: Colors.white,
      onBackground: AppColors.textPrimaryDark,
      onSurface: AppColors.textPrimaryDark,
    ),
    // All TextFormFields inherit this decoration — screens only override specific properties.
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.inputDark,
      hintStyle: const TextStyle(color: AppColors.textHintDark, fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.borderDark),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.borderDark),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.purple, width: 1.5),
      ),
    ),
    // Checkbox fill uses purple when selected, transparent otherwise.
    checkboxTheme: CheckboxThemeData(
      fillColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) return AppColors.purple;
        return Colors.transparent;
      }),
      side: const BorderSide(color: AppColors.borderDark, width: 1.5),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
    ),
    // Full-width purple button used as the primary CTA across all screens.
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.purple,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(color: AppColors.textPrimaryDark),
      bodyLarge: TextStyle(color: AppColors.textPrimaryDark),
      bodyMedium: TextStyle(color: AppColors.textSecondaryDark),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.backgroundDark,
      elevation: 0,
      iconTheme: IconThemeData(color: AppColors.textPrimaryDark),
      titleTextStyle: TextStyle(
        color: AppColors.textPrimaryDark,
        fontSize: 20,
        fontWeight: FontWeight.w700,
      ),
    ),
  );

  // Light theme — used when ThemeProvider.isDark is false.
  static ThemeData get light => ThemeData(
    brightness: Brightness.light,
    scaffoldBackgroundColor: AppColors.backgroundLight,
    colorScheme: const ColorScheme.light(
      background: AppColors.backgroundLight,
      surface: AppColors.surfaceLight,
      primary: AppColors.purple,
      onPrimary: Colors.white,
      onBackground: AppColors.textPrimaryLight,
      onSurface: AppColors.textPrimaryLight,
    ),
    // All TextFormFields inherit this decoration — screens only override specific properties.
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.inputLight,
      hintStyle: const TextStyle(color: AppColors.textHintLight, fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.borderLight),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.borderLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.purple, width: 1.5),
      ),
    ),
    // Checkbox fill uses purple when selected, transparent otherwise.
    checkboxTheme: CheckboxThemeData(
      fillColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) return AppColors.purple;
        return Colors.transparent;
      }),
      side: const BorderSide(color: AppColors.borderLight, width: 1.5),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
    ),
    // Full-width purple button used as the primary CTA across all screens.
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.purple,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(color: AppColors.textPrimaryLight),
      bodyLarge: TextStyle(color: AppColors.textPrimaryLight),
      bodyMedium: TextStyle(color: AppColors.textSecondaryLight),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.backgroundLight,
      elevation: 0,
      iconTheme: IconThemeData(color: AppColors.textPrimaryLight),
      titleTextStyle: TextStyle(
        color: AppColors.textPrimaryLight,
        fontSize: 20,
        fontWeight: FontWeight.w700,
      ),
    ),
  );
}