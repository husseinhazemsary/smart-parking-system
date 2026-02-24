// Splash screen — shown on cold launch for 2.5 seconds before navigating to onboarding.
// Uses a fade-in animation to smoothly reveal the logo and tagline.
import 'package:flutter/material.dart';
import 'package:ezrakna/l10n/app_localizations.dart';
import '../onboarding/onboarding_screen.dart';
import '../../theme/app_colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // 1.2s fade-in gives the logo time to appear without feeling sluggish.
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    );

    _controller.forward();

    // 2.5s total display time — long enough to see the logo, short enough not to block.
    Future.delayed(const Duration(milliseconds: 2500), () {
      // Check mounted before navigating to avoid setState on a disposed widget.
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const OnboardingScreen()),
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [

              // Logo asset — place logo.png in assets/images/ and declare in pubspec.yaml.
              Image.asset(
                'assets/images/logo.png',
                width: 220,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 24),
              Text(
                l10n.splashTagline,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                  letterSpacing: 0.3,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}