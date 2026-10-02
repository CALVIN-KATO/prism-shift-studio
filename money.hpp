#pragma once
// Conversion helpers between JSON doubles and internal integer cents.
#include <cmath>
#include <cstdint>
#include <optional>

namespace bank {

constexpr double kMaxAmountDollars = 1e12;

// Returns cents if `amount` is finite, within range, and has at most 2 decimals.
// Zero is only accepted when allowZero is true (used for initial balance).
inline std::optional<std::int64_t> parseAmountToCents(double amount, bool allowZero = false) {
    if (!std::isfinite(amount)) return std::nullopt;
    if (amount < 0.0 || amount > kMaxAmountDollars) return std::nullopt;
    if (amount == 0.0 && !allowZero) return std::nullopt;

    const double scaled  = amount * 100.0;
    const double rounded = std::round(scaled);
    if (std::fabs(scaled - rounded) > 1e-6) return std::nullopt;  // > 2 decimal places

    const auto cents = static_cast<std::int64_t>(rounded);
    if (cents == 0 && !allowZero) return std::nullopt;
    return cents;
}

inline double centsToDollars(std::int64_t cents) {
    return static_cast<double>(cents) / 100.0;
}

}  // namespace bank
