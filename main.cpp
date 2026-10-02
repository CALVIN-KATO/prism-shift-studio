#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <string>

#include "bank_service.hpp"
#include "routes.hpp"

namespace {

std::uint16_t resolvePort(int argc, char* argv[]) {
    const char* raw = (argc > 1) ? argv[1] : std::getenv("PORT");
    if (!raw) return 18080;
    try {
        const int p = std::stoi(raw);
        if (p > 0 && p <= 65535) return static_cast<std::uint16_t>(p);
    } catch (...) {}
    std::cerr << "Invalid port '" << raw << "', falling back to 18080\n";
    return 18080;
}

}  // namespace

int main(int argc, char* argv[]) {
    bank::BankService service;
    bank::BankApp     app;

    // CORS: allow a browser frontend to call the API. Restrict CORS_ORIGIN in production.
    const char* originEnv = std::getenv("CORS_ORIGIN");
    const std::string origin = originEnv ? originEnv : "*";
    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors.global()
        .origin(origin)
        .methods(crow::HTTPMethod::GET, crow::HTTPMethod::POST, crow::HTTPMethod::OPTIONS)
        .headers("Content-Type", "Accept");

    bank::registerRoutes(app, service);

    const auto port = resolvePort(argc, argv);
    std::cout << "Bank API listening on port " << port << " (CORS origin: " << origin << ")\n";
    app.loglevel(crow::LogLevel::Info).port(port).multithreaded().run();
    return 0;
}
