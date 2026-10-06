package com.agpdesing.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import com.agpdesing.application.exception.ApplicationException;
import com.agpdesing.domain.exception.DomainException;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

/**
 * La regla de dependencias, verificada en cada build:
 *   domain  <- application <- presentation
 *   infrastructure puede ver a todos; nadie ve a infrastructure.
 *
 * Y lo que CLAUDE.md promete para el núcleo: domain/ y application/ sin Spring, JPA, validación,
 * Jackson, JJWT, servlets ni bucket4j.
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

    private static final String[] FRAMEWORKS = {
            "org.springframework..", "jakarta.persistence..", "jakarta.validation..", "jakarta.servlet..",
            "com.fasterxml..", "io.jsonwebtoken..", "io.github.bucket4j.."};

    @ArchTest
    static final ArchRule domainIsFrameworkFree = noClasses().that().resideInAPackage("com.agpdesing.domain..")
            .should().dependOnClassesThat().resideInAnyPackage(FRAMEWORKS);

    @ArchTest
    static final ArchRule applicationIsFrameworkFree = noClasses().that().resideInAPackage("com.agpdesing.application..")
            .should().dependOnClassesThat().resideInAnyPackage(FRAMEWORKS);

    /** Cada error vive en la capa que lo lanza y hereda de su base: así el manejador sabe de dónde viene. */
    @ArchTest
    static final ArchRule domainExceptionsShareABase = classes().that().resideInAPackage("com.agpdesing.domain.exception..")
            .should().beAssignableTo(DomainException.class);

    @ArchTest
    static final ArchRule applicationExceptionsShareABase = classes().that().resideInAPackage("com.agpdesing.application.exception..")
            .should().beAssignableTo(ApplicationException.class);
}
