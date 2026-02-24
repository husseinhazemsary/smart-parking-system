// Central color palette for EzRakna — all screens source colors from here.
// Never hardcode colors in widgets; always reference AppColors.
import 'package:flutter/material.dart';

class AppColors {

  // Deep navy-black used as the main scaffold background in dark mode.
  static const Color backgroundDark = Color(0xFF000011);
  // Soft off-white with a blue tint for light mode scaffold background.
  static const Color backgroundLight = Color(0xFFF4F4FF);

  // Slightly elevated surface color for cards and inputs in dark mode.
  static const Color surfaceDark = Color(0xFF0D0D1F);
  static const Color surfaceLight = Color(0xFFFFFFFF);

  // Input field fill color in dark mode — matches surfaceDark intentionally.
  static const Color inputDark = Color(0xFF0D0D1F);
  static const Color inputLight = Color(0xFFEDEDF5);

  // Primary brand purple — used for buttons, active states and gradient borders.
  static const Color purple = Color(0xFF7D39EB);
  static const Color purpleLight = Color(0xFF9B5FF5);
  // Neon green accent — used sparingly for highlights and CTAs.
  static const Color accentGreen = Color(0xFFC6FF33);

  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textPrimaryLight = Color(0xFF0D0D1F);
  static const Color textSecondaryDark = Color(0xFFAAAAAA);
  static const Color textSecondaryLight = Color(0xFF555577);
  static const Color textHintDark = Color(0xFF555577);
  static const Color textHintLight = Color(0xFFAAAAAA);

  // Subtle border color in dark mode — just enough contrast without being harsh.
  static const Color borderDark = Color(0xFF1E1E3A);
  static const Color borderLight = Color(0xFFCCCCDD);

  // Bottom navigation bar background colors.
  static const Color navBarDark = Color(0xFF0A0A1A);
  static const Color navBarLight = Color(0xFFFFFFFF);
}