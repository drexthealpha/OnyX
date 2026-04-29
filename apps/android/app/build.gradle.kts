import com.android.build.api.variant.impl.VariantOutputImpl

val dnsjavaInetAddressResolverService = "META-INF/services/java.net.spi.InetAddressResolverProvider"

val androidStoreFile = providers.gradleProperty("ONYX_ANDROID_STORE_FILE").orNull?.takeIf { it.isNotBlank() }
val androidStorePassword = providers.gradleProperty("ONYX_ANDROID_STORE_PASSWORD").orNull?.takeIf { it.isNotBlank() }
val androidKeyAlias = providers.gradleProperty("ONYX_ANDROID_KEY_ALIAS").orNull?.takeIf { it.isNotBlank() }
val androidKeyPassword = providers.gradleProperty("ONYX_ANDROID_KEY_PASSWORD").orNull?.takeIf { it.isNotBlank() }
val resolvedAndroidStoreFile =
    androidStoreFile?.let { storeFilePath ->
        if (storeFilePath.startsWith("~/")) {
            "${System.getProperty("user.home")}/${storeFilePath.removePrefix("~/")}"
        } else {
            storeFilePath
        }
    }

val hasAndroidReleaseSigning =
    listOf(resolvedAndroidStoreFile, androidStorePassword, androidKeyAlias, androidKeyPassword).all { it != null }

val wantsAndroidReleaseBuild =
    gradle.startParameter.taskNames.any { taskName ->
        taskName.contains("Release", ignoreCase = true) ||
            Regex("""(^|:)(bundle|assemble)$""").containsMatchIn(taskName)
    }

if (wantsAndroidReleaseBuild && !hasAndroidReleaseSigning) {
    error(
        "Missing Android release signing properties. Set ONYX_ANDROID_STORE_FILE, " +
            "ONYX_ANDROID_STORE_PASSWORD, ONYX_ANDROID_KEY_ALIAS, and " +
            "ONYX_ANDROID_KEY_PASSWORD in ~/.gradle/gradle.properties.",
    )
}

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "ai.onyx.app"
    compileSdk = 36

    signingConfigs {
        if (hasAndroidReleaseSigning) {
            create("release") {
                storeFile = project.file(checkNotNull(resolvedAndroidStoreFile))
                storePassword = checkNotNull(androidStorePassword)
                keyAlias = checkNotNull(androidKeyAlias)
                keyPassword = checkNotNull(androidKeyPassword)
            }
        }
    }

    sourceSets {
        getByName("main") {
        }
    }

    defaultConfig {
        applicationId = "ai.onyx.app"
        minSdk = 31
        targetSdk = 36
        versionCode = 2026042600
        versionName = "2026.4.26"
    }

    flavorDimensions += "store"

    productFlavors {
        create("play") {
            dimension = "store"
            buildConfigField("boolean", "ONYX_ENABLE_SMS", "false")
            buildConfigField("boolean", "ONYX_ENABLE_CALL_LOG", "false")
        }
        create("thirdParty") {
            dimension = "store"
            buildConfigField("boolean", "ONYX_ENABLE_SMS", "true")
            buildConfigField("boolean", "ONYX_ENABLE_CALL_LOG", "true")
        }
    }

    buildTypes {
        release {
            if (hasAndroidReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
            isMinifyEnabled = true
            isShrinkResources = true
            ndk { debugSymbolLevel = "SYMBOL_TABLE" }
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug { isMinifyEnabled = false }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    packaging {
        resources {
            excludes += setOf(
                "/META-INF/{AL2.0,LGPL2.1}",
                "/META-INF/*.version",
                "/META-INF/LICENSE*.txt",
                "DebugProbesKt.bin",
                "kotlin-tooling-metadata.json",
                "/META-INF/versions/9/OSGI-INF/MANIFEST.MF"
            )
        }
    }

    lint {
        disable += setOf("AndroidGradlePluginVersion", "GradleDependency", "IconLauncherShape", "NewerVersionAvailable")
        warningsAsErrors = true
    }

    testOptions { unitTests.isIncludeAndroidResources = true }
}

androidComponents {
    onVariants { variant ->
        variant.outputs.filterIsInstance<VariantOutputImpl>().forEach { output ->
            val versionName = output.versionName.orNull ?: "0"
            val buildType = variant.buildType
            val flavorName = variant.flavorName?.takeIf { it.isNotBlank() }
            output.outputFileName = if (flavorName == null) {
                "onyx-$versionName-$buildType.apk"
            } else {
                "onyx-$versionName-$flavorName-$buildType.apk"
            }
        }
    }
}

kotlin {
    jvmToolchain(21)
}

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2026.03.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)
    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.10.0")
    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.webkit:webkit:1.15.0")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("com.google.android.material:material:1.13.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.11.0")
    implementation("androidx.security:security-crypto:1.1.0")
    implementation("androidx.exifinterface:exifinterface:1.4.2")
    implementation("com.squareup.okhttp3:okhttp:5.3.2")
    implementation("org.bouncycastle:bcprov-jdk18on:1.84")
    implementation("org.commonmark:commonmark:0.28.0")
    implementation("org.commonmark:commonmark-ext-autolink:0.28.0")
    implementation("org.commonmark:commonmark-ext-gfm-strikethrough:0.28.0")
    implementation("org.commonmark:commonmark-ext-gfm-tables:0.28.0")
    implementation("org.commonmark:commonmark-ext-task-list-items:0.28.0")
    implementation("androidx.camera:camera-core:1.5.2")
    implementation("androidx.camera:camera-camera2:1.5.2")
    implementation("androidx.camera:camera-lifecycle:1.5.2")
    implementation("androidx.camera:camera-video:1.5.2")
    implementation("com.google.android.gms:play-services-code-scanner:16.1.0")
    implementation("dnsjava:dnsjava:3.6.4")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")
    testImplementation("io.kotest:kotest-runner-junit5-jvm:6.1.11")
    testImplementation("io.kotest:kotest-assertions-core-jvm:6.1.11")
    testImplementation("com.squareup.okhttp3:mockwebserver:5.3.2")
    testImplementation("org.robolectric:robolectric:4.16.1")
    testRuntimeOnly("org.junit.vintage:junit-vintage-engine:6.0.3")
}

tasks.withType<Test>().configureEach { useJUnitPlatform() }