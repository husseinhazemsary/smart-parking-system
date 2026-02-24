// History screen — shows past parking sessions and transactions.
// Currently a placeholder; replace body with a paginated session list.
import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor:
      isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: const Center(
        child: Text(
          'History',
          style: TextStyle(color: Colors.white, fontSize: 24),
        ),
      ),
    );
  }
}