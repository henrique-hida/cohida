package com.hida.cohida.demo;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/demo")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDemoController {
    private final DemoSeederService demo;

    public AdminDemoController(DemoSeederService d) {
        demo = d;
    }

    @PostMapping("/seed")
    public Map<String, Integer> seed() {
        return demo.seed();
    }

    @DeleteMapping("/seed")
    public void hide() {
        demo.hide();
    }
}
