import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_colors.dart';

class OtpInput extends StatefulWidget {
  final void Function(String) onChanged;

  const OtpInput({super.key, required this.onChanged});

  @override
  State<OtpInput> createState() => _OtpInputState();
}

class _OtpInputState extends State<OtpInput> {
  final _controllers = List.generate(6, (_) => TextEditingController());
  final _focuses = List.generate(6, (_) => FocusNode());

  String get _code => _controllers.map((c) => c.text).join();

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focuses) {
      f.dispose();
    }
    super.dispose();
  }

  void _onChanged(int index, String value) {
    final digits = value.replaceAll(RegExp(r'\D'), '');

    if (digits.isEmpty) {
      widget.onChanged(_code);
      return;
    }

    if (digits.length > 1) {
      // Paste — distribute across boxes starting from current index
      int filled = 0;
      for (int i = index; i < 6 && filled < digits.length; i++, filled++) {
        _controllers[i].text = digits[filled];
      }
      final nextIndex = (index + digits.length).clamp(0, 5);
      _focuses[nextIndex].requestFocus();
      widget.onChanged(_code);
      return;
    }

    _controllers[index].text = digits;
    widget.onChanged(_code);
    if (index < 5) {
      _focuses[index + 1].requestFocus();
    } else {
      _focuses[index].unfocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(6, (i) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Focus(
            onKeyEvent: (node, event) {
              if (event is KeyDownEvent &&
                  event.logicalKey == LogicalKeyboardKey.backspace &&
                  _controllers[i].text.isEmpty &&
                  i > 0) {
                _controllers[i - 1].clear();
                _focuses[i - 1].requestFocus();
                widget.onChanged(_code);
                return KeyEventResult.handled;
              }
              return KeyEventResult.ignored;
            },
            child: SizedBox(
              width: 44,
              height: 52,
              child: TextField(
                controller: _controllers[i],
                focusNode: _focuses[i],
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                maxLength: 1,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  counterText: '',
                  contentPadding: EdgeInsets.zero,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(
                      color: AppColors.borderDark,
                      width: 1.5,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(
                      color: AppColors.purple,
                      width: 1.5,
                    ),
                  ),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.04),
                ),
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
                onChanged: (value) => _onChanged(i, value),
              ),
            ),
          ),
        );
      }),
    );
  }
}
