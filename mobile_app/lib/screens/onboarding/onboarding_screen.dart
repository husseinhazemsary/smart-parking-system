import 'package:flutter/material.dart';
import 'package:ezrakna/l10n/app_localizations.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:video_player/video_player.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../auth/login_screen.dart';
import 'dart:ui' show lerpDouble;

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final int _totalPages = 3;

  void _goToNext() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    } else {
      _navigateToLogin();
    }
  }

  void _goBack() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    }
  }

  void _navigateToLogin() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final pages = [
      _OnboardingPage(
        videoAsset: 'assets/videos/onboarding1.mp4',
        titleStart: l10n.onboarding1Title,
        titleHighlight: l10n.onboarding1Highlight,
        titleEnd: '',
        subtitle: l10n.onboarding1Subtitle,
      ),
      _OnboardingPage(
        videoAsset: 'assets/videos/onboarding2.mp4',
        titleStart: l10n.onboarding2Title,
        titleHighlight: l10n.onboarding2Highlight,
        titleEnd: l10n.onboarding2TitleEnd,
        subtitle: l10n.onboarding2Subtitle,
      ),
      _OnboardingPage(
        videoAsset: 'assets/videos/onboarding3.mp4',
        titleStart: '',
        titleHighlight: l10n.onboarding3TitleHighlight,
        titleEnd: l10n.onboarding3Title,
        subtitle: l10n.onboarding3Subtitle,
        highlightFirst: true,
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: SafeArea(
        child: Column(
          children: [
            // Top nav
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _currentPage > 0
                      ? GestureDetector(
                    onTap: _goBack,
                    child: Row(
                      children: [
                        const Icon(Icons.arrow_back,
                            color: Colors.white, size: 18),
                        const SizedBox(width: 4),
                        Text(l10n.back,
                            style: const TextStyle(
                                color: Colors.white, fontSize: 15)),
                      ],
                    ),
                  )
                      : const SizedBox(width: 60),
                  GestureDetector(
                    onTap: _navigateToLogin,
                    child: Text(
                      l10n.skip,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),

            // Pages
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _totalPages,
                onPageChanged: (index) =>
                    setState(() => _currentPage = index),
                itemBuilder: (_, index) => pages[index],
              ),
            ),

            // Bottom bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D0D1F),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _SwipeButton(
                      label: _currentPage == _totalPages - 1
                          ? l10n.getStarted
                          : l10n.next,
                      onSwipeComplete: _goToNext,
                    ),
                    const Spacer(),
                    SmoothPageIndicator(
                      controller: _pageController,
                      count: _totalPages,
                      effect: const WormEffect(
                        dotWidth: 8,
                        dotHeight: 8,
                        activeDotColor: AppColors.purple,
                        dotColor: Color(0xFF2A2A4A),
                        spacing: 6,
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Single onboarding page
// ---------------------------------------------------------------------------
class _OnboardingPage extends StatelessWidget {
  final String videoAsset;
  final String titleStart;
  final String titleHighlight;
  final String titleEnd;
  final String subtitle;
  final bool highlightFirst;

  const _OnboardingPage({
    required this.videoAsset,
    required this.titleStart,
    required this.titleHighlight,
    required this.titleEnd,
    required this.subtitle,
    this.highlightFirst = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 16),

          _VideoPlayer(assetPath: videoAsset),

          const SizedBox(height: 70),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                style: GoogleFonts.poppins(
                  fontSize: 32,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  height: 1.3,
                ),
                children: highlightFirst
                    ? [
                  TextSpan(
                    text: titleHighlight,
                    style: GoogleFonts.poppins(
                      color: AppColors.purple,
                      fontWeight: FontWeight.w700,
                      fontSize: 32,
                    ),
                  ),
                  TextSpan(text: titleEnd),
                ]
                    : [
                  TextSpan(text: titleStart),
                  if (titleStart.isNotEmpty) const TextSpan(text: ' '),
                  TextSpan(
                    text: titleHighlight,
                    style: GoogleFonts.poppins(
                      color: AppColors.purple,
                      fontWeight: FontWeight.w700,
                      fontSize: 32,
                    ),
                  ),
                  if (titleEnd.isNotEmpty) TextSpan(text: titleEnd),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25),
            child: Text(
              subtitle,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w300,
                fontSize: 16,
                color: AppColors.textSecondaryDark,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Swipe button — drag the button itself to the right to trigger
// ---------------------------------------------------------------------------
// Replace the entire _SwipeButton and _SwipeButtonState classes with this:

// Replace the entire _SwipeButton and _SwipeButtonState classes with this:
// Also add this import at the top of the file if not already present:
// import 'dart:ui' show lerpDouble;

class _SwipeButton extends StatefulWidget {
  final String label;
  final VoidCallback onSwipeComplete;

  const _SwipeButton({required this.label, required this.onSwipeComplete});

  @override
  State<_SwipeButton> createState() => _SwipeButtonState();
}

class _SwipeButtonState extends State<_SwipeButton>
    with TickerProviderStateMixin {
  double _dragOffset = 0;
  double _startOffset = 0;
  bool _isDragging = false;

  // Idle wobble
  late AnimationController _wobbleController;
  late Animation<double> _wobbleAnimation;

  // Snap back
  late AnimationController _snapController;
  late Animation<double> _snapAnimation;

  // Smooth return after trigger
  late AnimationController _returnController;
  late Animation<double> _returnAnimation;

  // Drag progress (0=idle, 1=fully dragged) — drives circle + arrows + text
  late AnimationController _dragAnimController;
  late Animation<double> _dragAnim;

  static const double _buttonHeight = 50;
  static const double _triggerFraction = 0.55;

  @override
  void initState() {
    super.initState();

    // Wobble
    _wobbleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _wobbleAnimation = Tween<double>(begin: -5.0, end: 5.0).animate(
      CurvedAnimation(parent: _wobbleController, curve: Curves.easeInOut),
    );

    // Snap back
    _snapController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    // Smooth return after trigger
    _returnController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 450),
    );

    // Drag progress controller
    _dragAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    _dragAnim = CurvedAnimation(
      parent: _dragAnimController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void didUpdateWidget(_SwipeButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.label != widget.label) _resetInstant();
  }

  void _resetInstant() {
    _returnController.reset();
    _snapController.reset();
    _dragAnimController.reverse();
    setState(() => _dragOffset = 0);
    _wobbleController.repeat(reverse: true);
  }

  void _snapBack() {
    final startOffset = _dragOffset;
    _snapAnimation = Tween<double>(begin: startOffset, end: 0).animate(
      CurvedAnimation(parent: _snapController, curve: Curves.elasticOut),
    )..addListener(() => setState(() => _dragOffset = _snapAnimation.value));
    _snapController.forward(from: 0);
    _dragAnimController.reverse();
    Future.delayed(const Duration(milliseconds: 350), () {
      if (mounted) _wobbleController.repeat(reverse: true);
    });
  }

  void _smoothReturn(double fromOffset) {
    _dragAnimController.reverse();
    _returnAnimation = Tween<double>(begin: fromOffset, end: 0).animate(
      CurvedAnimation(parent: _returnController, curve: Curves.easeOutCubic),
    )..addListener(() => setState(() => _dragOffset = _returnAnimation.value));
    _returnController.forward(from: 0).then((_) {
      if (mounted) _wobbleController.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _wobbleController.dispose();
    _snapController.dispose();
    _returnController.dispose();
    _dragAnimController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 140,
      height: _buttonHeight,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final maxDrag = constraints.maxWidth;

          return GestureDetector(
            onHorizontalDragStart: (details) {
              _wobbleController.stop();
              _snapController.stop();
              _returnController.stop();
              _startOffset = details.localPosition.dx;
              setState(() => _isDragging = true);
            },
            onHorizontalDragUpdate: (details) {
              final delta = details.localPosition.dx - _startOffset;
              final newOffset = delta.clamp(0.0, maxDrag);
              setState(() => _dragOffset = newOffset);
              final progress = (newOffset / maxDrag).clamp(0.0, 1.0);
              _dragAnimController.animateTo(
                progress,
                duration: Duration.zero,
              );
            },
            onHorizontalDragEnd: (_) {
              setState(() => _isDragging = false);
              if (_dragOffset >= maxDrag * _triggerFraction) {
                final offsetAtTrigger = _dragOffset;
                widget.onSwipeComplete();
                Future.delayed(const Duration(milliseconds: 80), () {
                  if (mounted) _smoothReturn(offsetAtTrigger);
                });
              } else {
                _snapBack();
              }
            },
            child: AnimatedBuilder(
              animation: Listenable.merge([
                _wobbleAnimation,
                _dragAnim,
                _snapController,
                _returnController,
              ]),
              builder: (context, child) {
                final wobbleOffset = (!_isDragging &&
                    !_snapController.isAnimating &&
                    !_returnController.isAnimating)
                    ? _wobbleAnimation.value
                    : 0.0;

                final t = _dragAnim.value;

                // Circle grows from nothing to fill button
                final circleSize = lerpDouble(0, 200, t)!;

                // Text shifts slightly right
                final textShift = lerpDouble(0, 10, t)!;

                // Right arrow slides out to the right
                final arr1Right = lerpDouble(12.0, -30.0, t)!;

                // Left arrow slides in from the left
                final arr2Left = lerpDouble(-30.0, 12.0, t)!;

                // Text and icon color flip to dark as circle fills
                final contentColor = Color.lerp(
                    Colors.white, const Color(0xFF1A0A2E), t)!;

                return Transform.translate(
                  offset: Offset(_dragOffset + wobbleOffset, 0),
                  child: Container(
                    height: _buttonHeight,
                    decoration: BoxDecoration(
                      color: AppColors.purple,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    clipBehavior: Clip.hardEdge,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Expanding white circle from center
                        Positioned(
                          left: 70 - circleSize / 2,
                          top: _buttonHeight / 2 - circleSize / 2,
                          child: Container(
                            width: circleSize,
                            height: circleSize,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.18),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),

                        // arr-2: arrow sliding in from the left
                        Positioned(
                          left: arr2Left,
                          child: Icon(
                            Icons.arrow_forward,
                            size: 18,
                            color: contentColor,
                          ),
                        ),

                        // Label text
                        Transform.translate(
                          offset: Offset(textShift, 0),
                          child: Text(
                            widget.label,
                            style: GoogleFonts.poppins(
                              color: contentColor,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),

                        // arr-1: arrow sliding out to the right
                        Positioned(
                          right: arr1Right,
                          child: Icon(
                            Icons.arrow_forward,
                            size: 18,
                            color: contentColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Video player widget — loops silently, no controls
// ---------------------------------------------------------------------------
class _VideoPlayer extends StatefulWidget {
  final String assetPath;
  const _VideoPlayer({required this.assetPath});

  @override
  State<_VideoPlayer> createState() => _VideoPlayerState();
}

class _VideoPlayerState extends State<_VideoPlayer> {
  late VideoPlayerController _controller;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.asset(widget.assetPath)
      ..initialize().then((_) {
        if (mounted) {
          setState(() => _initialized = true);
          _controller.setLooping(true);
          _controller.setVolume(0);
          _controller.play();
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
    if (!_initialized) {
      return Container(
        width: double.infinity,
        height: 260,
        decoration: BoxDecoration(
          color: const Color(0xFF0D0D2A),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Center(
          child: CircularProgressIndicator(
            color: AppColors.purple.withOpacity(0.5),
            strokeWidth: 2,
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: AspectRatio(
        aspectRatio: _controller.value.aspectRatio,
        child: VideoPlayer(_controller),
      ),
    );
  }
}