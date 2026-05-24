package com.solvad.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solvad.backend.dto.ProblemRequest;
import com.solvad.backend.dto.SubtaskRequest;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class ProblemPdfService {

    private static final float MARGIN = 50;
    private static final float BULLET_INDENT = 15;
    private static final float TITLE_FONT_SIZE = 20;
    private static final float HEADING_FONT_SIZE = 16;
    private static final float SUBHEADING_FONT_SIZE = 14;
    private static final float BODY_FONT_SIZE = 11;
    private static final float SMALL_FONT_SIZE = 10;
    private static final float LINE_HEIGHT = 14;
    
    private static final PDFont FONT_BOLD = PDType1Font.HELVETICA_BOLD;
    private static final PDFont FONT_REGULAR = PDType1Font.HELVETICA;
    private static final PDFont FONT_ITALIC = PDType1Font.HELVETICA_OBLIQUE;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate a comprehensive PDF document for a problem submission
     * @param request The problem request containing all details
     * @param seekerName The name of the organization/seeker
     * @return PDF as byte array
     */
    public byte[] generateProblemPdf(ProblemRequest request, String seekerName) throws IOException {
        try (PDDocument document = new PDDocument()) {
            
            // Page 1: Problem Overview
            addProblemOverviewPage(document, request, seekerName);
            
            // Page 2+: Sub-problems (if any)
            if (request.getSubtasks() != null && !request.getSubtasks().isEmpty()) {
                addSubproblemsPages(document, request.getSubtasks());
            }
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private void addProblemOverviewPage(PDDocument document, ProblemRequest request, String seekerName) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);
        
        float pageWidth = page.getMediaBox().getWidth();
        float pageHeight = page.getMediaBox().getHeight();
        float yPosition = pageHeight - MARGIN;
        
        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            
            // Title
            contentStream.beginText();
            contentStream.setFont(FONT_BOLD, TITLE_FONT_SIZE);
            contentStream.newLineAtOffset(MARGIN, yPosition);
            contentStream.showText("Problem Submission");
            contentStream.endText();
            yPosition -= 30;
            
            // Seeker name
            contentStream.beginText();
            contentStream.setFont(FONT_REGULAR, BODY_FONT_SIZE);
            contentStream.newLineAtOffset(MARGIN, yPosition);
            contentStream.showText("Submitted by: " + seekerName);
            contentStream.endText();
            yPosition -= 25;
            
            // Divider line
            contentStream.setLineWidth(1f);
            contentStream.moveTo(MARGIN, yPosition);
            contentStream.lineTo(pageWidth - MARGIN, yPosition);
            contentStream.stroke();
            yPosition -= 20;
            
            // Problem Title
            yPosition = addSectionHeading(contentStream, "Problem Title", yPosition);
            yPosition = addWrappedText(contentStream, request.getTitle(), MARGIN, yPosition, pageWidth - 2 * MARGIN, BODY_FONT_SIZE, FONT_REGULAR);
            yPosition -= 15;
            
            // Background Context
            if (request.getBackgroundContext() != null && !request.getBackgroundContext().isEmpty()) {
                yPosition = addSectionHeading(contentStream, "Background Context", yPosition);
                yPosition = addWrappedText(contentStream, request.getBackgroundContext(), MARGIN, yPosition, pageWidth - 2 * MARGIN, BODY_FONT_SIZE, FONT_REGULAR);
                yPosition -= 15;
            }
            
            // Primary Statement
            yPosition = addSectionHeading(contentStream, "Primary Statement", yPosition);
            yPosition = addWrappedText(contentStream, request.getPrimaryStatement(), MARGIN, yPosition, pageWidth - 2 * MARGIN, BODY_FONT_SIZE, FONT_REGULAR);
            yPosition -= 15;
            
            // Objectives
            if (request.getObjectives() != null && !request.getObjectives().isEmpty()) {
                yPosition = addSectionHeading(contentStream, "Objectives", yPosition);
                List<String> objectivesList = parseListField(request.getObjectives());
                yPosition = addBulletedList(contentStream, objectivesList, MARGIN, yPosition, pageWidth - 2 * MARGIN, BODY_FONT_SIZE, FONT_REGULAR);
                yPosition -= 15;
            }
            
            // Constraints
            if (request.getConstraints() != null && !request.getConstraints().isEmpty()) {
                yPosition = addSectionHeading(contentStream, "Constraints", yPosition);
                List<String> constraintsList = parseListField(request.getConstraints());
                yPosition = addBulletedList(contentStream, constraintsList, MARGIN, yPosition, pageWidth - 2 * MARGIN, BODY_FONT_SIZE, FONT_REGULAR);
                yPosition -= 15;
            }
            
            // Preferred Program
            if (request.getPreferredProgram() != null && !request.getPreferredProgram().isEmpty()) {
                yPosition = addSectionHeading(contentStream, "Preferred Academic Program", yPosition);
                contentStream.beginText();
                contentStream.setFont(FONT_REGULAR, BODY_FONT_SIZE);
                contentStream.newLineAtOffset(MARGIN, yPosition);
                contentStream.showText(request.getPreferredProgram());
                contentStream.endText();
                yPosition -= 20;
            }
            
            // SDG Focus
            if (request.getSdgFocus() != null && !request.getSdgFocus().isEmpty()) {
                yPosition = addSectionHeading(contentStream, "SDG Alignment", yPosition);
                contentStream.beginText();
                contentStream.setFont(FONT_REGULAR, BODY_FONT_SIZE);
                contentStream.newLineAtOffset(MARGIN, yPosition);
                contentStream.showText(request.getSdgFocus());
                contentStream.endText();
                yPosition -= 20;
            }
            
            // Number of sub-problems
            if (request.getSubtasks() != null && !request.getSubtasks().isEmpty()) {
                if (yPosition - 50 < MARGIN) {
                    // Need new page
                    contentStream.close();
                    PDPage newPage = new PDPage(PDRectangle.A4);
                    document.addPage(newPage);
                    yPosition = newPage.getMediaBox().getHeight() - MARGIN;
                    
                    PDPageContentStream newStream = new PDPageContentStream(document, newPage);
                    newStream.beginText();
                    newStream.setFont(FONT_ITALIC, SMALL_FONT_SIZE);
                    newStream.newLineAtOffset(MARGIN, yPosition);
                    newStream.showText("This problem includes " + request.getSubtasks().size() + " sub-problem(s). Details on following pages.");
                    newStream.endText();
                    newStream.close();
                } else {
                    contentStream.beginText();
                    contentStream.setFont(FONT_ITALIC, SMALL_FONT_SIZE);
                    contentStream.newLineAtOffset(MARGIN, yPosition);
                    contentStream.showText("This problem includes " + request.getSubtasks().size() + " sub-problem(s). Details on following pages.");
                    contentStream.endText();
                }
            }
        }
    }

    private void addSubproblemsPages(PDDocument document, List<SubtaskRequest> subtasks) throws IOException {
        for (int i = 0; i < subtasks.size(); i++) {
            SubtaskRequest subtask = subtasks.get(i);
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            
            float pageWidth = page.getMediaBox().getWidth();
            float pageHeight = page.getMediaBox().getHeight();
            float yPosition = pageHeight - MARGIN;
            
            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                
                // Sub-problem number
                contentStream.beginText();
                contentStream.setFont(FONT_BOLD, HEADING_FONT_SIZE);
                contentStream.newLineAtOffset(MARGIN, yPosition);
                contentStream.showText("Sub-Problem " + (i + 1));
                contentStream.endText();
                yPosition -= 25;
                
                // Divider line
                contentStream.setLineWidth(1f);
                contentStream.moveTo(MARGIN, yPosition);
                contentStream.lineTo(pageWidth - MARGIN, yPosition);
                contentStream.stroke();
                yPosition -= 20;
                
                // Title
                yPosition = addSectionHeading(contentStream, "Title", yPosition);
                yPosition = addWrappedText(contentStream, subtask.getTitle(), MARGIN, yPosition, pageWidth - 2 * MARGIN, BODY_FONT_SIZE, FONT_REGULAR);
                yPosition -= 15;
                
                // Description
                yPosition = addSectionHeading(contentStream, "Description", yPosition);
                yPosition = addWrappedText(contentStream, subtask.getDescription(), MARGIN, yPosition, pageWidth - 2 * MARGIN, BODY_FONT_SIZE, FONT_REGULAR);
                yPosition -= 15;
                
                // Department Focus
                if (subtask.getDepartmentFocus() != null && !subtask.getDepartmentFocus().isEmpty()) {
                    yPosition = addSectionHeading(contentStream, "Department Focus", yPosition);
                    contentStream.beginText();
                    contentStream.setFont(FONT_REGULAR, BODY_FONT_SIZE);
                    contentStream.newLineAtOffset(MARGIN, yPosition);
                    contentStream.showText(subtask.getDepartmentFocus());
                    contentStream.endText();
                    yPosition -= 20;
                }
                
                // SDG Focus
                if (subtask.getSdgFocus() != null && !subtask.getSdgFocus().isEmpty()) {
                    yPosition = addSectionHeading(contentStream, "SDG Focus", yPosition);
                    yPosition = addWrappedText(contentStream, subtask.getSdgFocus(), MARGIN, yPosition, pageWidth - 2 * MARGIN, BODY_FONT_SIZE, FONT_REGULAR);
                    yPosition -= 15;
                }
            }
        }
    }

    private float addSectionHeading(PDPageContentStream contentStream, String heading, float yPosition) throws IOException {
        contentStream.beginText();
        contentStream.setFont(FONT_BOLD, SUBHEADING_FONT_SIZE);
        contentStream.newLineAtOffset(MARGIN, yPosition);
        contentStream.showText(heading);
        contentStream.endText();
        return yPosition - 18;
    }

    private float addWrappedText(PDPageContentStream contentStream, String text, float x, float y, float maxWidth, float fontSize, PDFont font) throws IOException {
        if (text == null || text.isEmpty()) {
            return y;
        }
        
        List<String> lines = wrapText(text, maxWidth, fontSize, font);
        
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        
        for (int i = 0; i < lines.size(); i++) {
            if (i > 0) {
                contentStream.newLineAtOffset(0, -LINE_HEIGHT);
            }
            contentStream.showText(lines.get(i));
        }
        
        contentStream.endText();
        
        return y - (lines.size() * LINE_HEIGHT);
    }

    private List<String> wrapText(String text, float maxWidth, float fontSize, PDFont font) throws IOException {
        List<String> lines = new ArrayList<>();
        String[] paragraphs = text.split("\n");
        
        for (String paragraph : paragraphs) {
            String[] words = paragraph.split(" ");
            StringBuilder currentLine = new StringBuilder();
            
            for (String word : words) {
                String testLine = currentLine.length() == 0 ? word : currentLine + " " + word;
                float textWidth = font.getStringWidth(testLine) / 1000 * fontSize;
                
                if (textWidth > maxWidth && currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder(word);
                } else {
                    currentLine = new StringBuilder(testLine);
                }
            }
            
            if (currentLine.length() > 0) {
                lines.add(currentLine.toString());
            }
        }
        
        return lines;
    }

    /**
     * Parse a field that could be either a JSON array string or plain text
     * @param field The field value (JSON array or plain text)
     * @return List of items
     */
    private List<String> parseListField(String field) {
        if (field == null || field.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Try parsing as JSON array first
        if (field.trim().startsWith("[")) {
            try {
                return objectMapper.readValue(field, new TypeReference<List<String>>(){});
            } catch (Exception e) {
                // If JSON parsing fails, fall back to newline splitting
                System.err.println("Failed to parse field as JSON array, falling back to newline split: " + e.getMessage());
            }
        }
        
        // Fallback: treat as newline-separated or single item
        return Arrays.asList(field.split("\n"));
    }

    /**
     * Add a bulleted list to the PDF with proper wrapping for each item
     * @param contentStream The content stream to write to
     * @param items The list items to display
     * @param x Starting X position
     * @param y Starting Y position
     * @param maxWidth Maximum width for text wrapping
     * @param fontSize Font size
     * @param font Font to use
     * @return New Y position after the list
     */
    private float addBulletedList(PDPageContentStream contentStream, List<String> items, 
                                  float x, float y, float maxWidth, float fontSize, PDFont font) throws IOException {
        if (items == null || items.isEmpty()) {
            return y;
        }
        
        float currentY = y;
        
        for (String item : items) {
            if (item == null || item.trim().isEmpty()) {
                continue;
            }
            
            // Draw bullet point
            contentStream.beginText();
            contentStream.setFont(font, fontSize);
            contentStream.newLineAtOffset(x, currentY);
            contentStream.showText("\u2022"); // Unicode bullet character
            contentStream.endText();
            
            // Wrap and draw the item text with indent
            List<String> wrappedLines = wrapText(item.trim(), maxWidth - BULLET_INDENT - 5, fontSize, font);
            
            contentStream.beginText();
            contentStream.setFont(font, fontSize);
            contentStream.newLineAtOffset(x + BULLET_INDENT, currentY);
            
            for (int i = 0; i < wrappedLines.size(); i++) {
                if (i > 0) {
                    contentStream.newLineAtOffset(0, -LINE_HEIGHT);
                }
                contentStream.showText(wrappedLines.get(i));
            }
            
            contentStream.endText();
            
            // Move Y position down for next item (include extra spacing between items)
            currentY -= (wrappedLines.size() * LINE_HEIGHT) + 3;
        }
        
        return currentY;
    }
}
