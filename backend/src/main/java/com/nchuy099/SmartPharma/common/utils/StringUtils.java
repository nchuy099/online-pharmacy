package com.nchuy099.SmartPharma.common.utils;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class StringUtils {

    public static String toSlug(String input) {
        if (input == null || input.isEmpty()) {
            return "";
        }

        String nonAccent = removeDiacritics(input);

        String nowhitespace = nonAccent.toLowerCase()
                .replaceAll("[đĐ]", "d")
                .replaceAll("[^a-z0-9\\s-]", "") // Remove special characters
                .replaceAll("\\s+", "-") // Replace spaces with hyphens
                .replaceAll("-+", "-") // Replace consecutive hyphens
                .replaceAll("^-+|-+$", ""); // Trim hyphens

        return nowhitespace;
    }

    private static String removeDiacritics(String input) {
        String nfdNormalizedString = Normalizer.normalize(input, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(nfdNormalizedString).replaceAll("");
    }

    public static String generateProductCode() {
        return "PRO" + generateRandomDigits(6);
    }

    public static String generateSku(String productCode, int index) {
        return productCode + String.format("%03d", index);
    }

    private static String generateRandomDigits(int length) {
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }
}
