package com.duetracker.service;

import com.duetracker.dto.SellerRegisterDTO;
import com.duetracker.model.Seller;
import com.duetracker.repository.SellerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class SellerService {

    @Autowired
    private SellerRepository sellerRepository;


    // =====================================================
    // SELLER REGISTRATION
    // =====================================================

    public Seller registerSeller(SellerRegisterDTO dto) {

        // Validate request
        if (dto == null) {
            throw new RuntimeException("Registration data is required!");
        }

        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new RuntimeException("Name is required!");
        }

        if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required!");
        }

        if (dto.getPhone() == null || dto.getPhone().trim().isEmpty()) {
            throw new RuntimeException("Phone number is required!");
        }

        if (dto.getPassword() == null || dto.getPassword().trim().isEmpty()) {
            throw new RuntimeException("Password is required!");
        }

        if (dto.getStoreName() == null || dto.getStoreName().trim().isEmpty()) {
            throw new RuntimeException("Store name is required!");
        }


        // Clean input
        String name = dto.getName().trim();
        String email = dto.getEmail().trim().toLowerCase();
        String phone = dto.getPhone().trim();
        String password = dto.getPassword().trim();
        String storeName = dto.getStoreName().trim();


        // Password validation
        if (password.length() < 6) {
            throw new RuntimeException(
                    "Password must be at least 6 characters!"
            );
        }


        // Check duplicate email
        if (sellerRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new RuntimeException(
                    "Seller with email " + email + " already exists!"
            );
        }


        // Check duplicate phone
        if (sellerRepository.findByPhone(phone).isPresent()) {
            throw new RuntimeException(
                    "Seller with phone " + phone + " already exists!"
            );
        }


        // Create seller
        Seller seller = new Seller(
                name,
                email,
                phone,
                password,
                storeName
        );


        // Save to database
        return sellerRepository.save(seller);
    }


    // =====================================================
    // SELLER LOGIN
    // =====================================================

    public Seller authenticateSeller(
            String identifier,
            String password
    ) {

        // Validate input
        if (identifier == null ||
                identifier.trim().isEmpty()) {

            throw new RuntimeException(
                    "Email/phone is required!"
            );
        }

        if (password == null ||
                password.trim().isEmpty()) {

            throw new RuntimeException(
                    "Password is required!"
            );
        }


        // Clean input
        identifier = identifier.trim();
        password = password.trim();


        Optional<Seller> sellerOpt;


        // =================================================
        // LOGIN USING EMAIL
        // =================================================

        if (identifier.contains("@")) {

            sellerOpt =
                    sellerRepository.findByEmailIgnoreCase(identifier);

        }

        // =================================================
        // LOGIN USING PHONE
        // =================================================

        else {

            sellerOpt =
                    sellerRepository.findByPhone(identifier);
        }


        // Seller doesn't exist
        if (sellerOpt.isEmpty()) {

            throw new RuntimeException(
                    "Invalid seller email/phone or password!"
            );
        }


        Seller seller = sellerOpt.get();


        // =================================================
        // CHECK PASSWORD
        // =================================================

        if (seller.getPassword() == null ||
                !seller.getPassword().equals(password)) {

            throw new RuntimeException(
                    "Invalid seller email/phone or password!"
            );
        }


        // Login successful
        return seller;
    }


    // =====================================================
    // GET SELLER BY ID
    // =====================================================

    public Seller getSellerById(Long id) {

        return sellerRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Seller not found!"
                        )
                );
    }
}