#pragma once
// Domain models. Pure data, no logic, no HTTP.
#include <cstdint>
#include <string>
#include <vector>

namespace bank {

enum class TransactionType { Opening, Deposit, Withdrawal };

inline const char* toString(TransactionType type) {
    switch (type) {
        case TransactionType::Opening:    return "opening_balance";
        case TransactionType::Deposit:    return "deposit";
        case TransactionType::Withdrawal: return "withdrawal";
    }
    return "unknown";
}

// All money is stored as integer cents to avoid floating-point drift.
struct Transaction {
    std::uint64_t  id{0};
    TransactionType type{TransactionType::Deposit};
    std::int64_t   amountCents{0};
    std::int64_t   balanceAfterCents{0};
    std::string    timestamp;  // ISO-8601 UTC
};

struct Account {
    std::string              accountNumber;
    std::string              ownerName;
    std::int64_t             balanceCents{0};
    std::string              createdAt;  // ISO-8601 UTC
    std::vector<Transaction> history;
};

}  // namespace bank
