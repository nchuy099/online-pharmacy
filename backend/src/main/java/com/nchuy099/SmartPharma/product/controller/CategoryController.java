package com.nchuy099.SmartPharma.product.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nchuy099.SmartPharma.product.dto.response.CategoryResponse;
import com.nchuy099.SmartPharma.product.service.CategoryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/categories")
@Slf4j
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping("/list")
    public List<CategoryResponse> listActiveCategories() {
        log.info("Guest request to list active categories received");
        return categoryService.getAllActive();
    }
}
