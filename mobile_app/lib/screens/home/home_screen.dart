// Home screen — main landing tab after login.
// Currently a placeholder; replace body with map/parking discovery UI.
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor:
      isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: const Center(
        child: Text(
          'Home',
          style: TextStyle(color: Colors.white, fontSize: 24),
        ),
      ),
    );
  }
}