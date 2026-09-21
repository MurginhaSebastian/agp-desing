package com.agpdesing.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

/**
 * La regla de dependencias, verificada en cada build:
 *   domain  <- application <- presentation
 *   infrastructure puede ver a todos; nadie ve a infrastructure.
 */
@AnalyzeClasses(packages = "com.agpdesing", importOptions = ImportOption.DoNotIncludeTests.class)
class CleanArchitectureTest {

    @ArchTest
    static final ArchRule layers = layeredArchitecture().consideringAllDependencies()
            .layer("Domain").definedBy("com.agpdesing.domain..")
            .layer("Application").definedBy("com.agpdesing.application..")
            .layer("Presentation").definedBy("com.agpdesing.presentation..")
            .layer("Infrastructure").definedBy("com.agpdesing.infrastructure..")
            .whereLayer("Domain").mayOnlyBeAccessedByLayers("Application", "Presentation", "Infrastructure")
            .whereLayer("Application").mayOnlyBeAccessedByLayers("Presentation", "Infrastructure")
            .whereLayer("Presentation").mayNotBeAccessedByAnyLayer()
            .whereLayer("Infrastructure").mayNotBeAccessedByAnyLayer();

    @ArchTest
    static final ArchRule domainIsFrameworkFree = noClasses().that().resideInAPackage("com.agpdesing.domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                    "org.springframework..", "jakarta.persistence..", "jakarta.validation..", "com.fasterxml..");

    @ArchTest
    static final ArchRule applicationIsFrameworkFree = noClasses().that().resideInAPackage("com.agpdesing.application..")
            .should().dependOnClassesThat().resideInAnyPackage(
                    "org.springframework..", "jakarta.persistence..", "jakarta.validation..", "io.jsonwebtoken..");
}
