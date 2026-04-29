pluginManagement {
    repositories {
        gradlePluginPortal()
        google()
        mavenCentral()
    }
    plugins {
        id("com.android.application").version("8.9.2")
        id("org.jetbrains.kotlin.android").version("2.3.0")
        id("org.jetbrains.kotlin.plugin.compose").version("2.3.0")
        id("org.jetbrains.kotlin.plugin.serialization").version("2.3.0")
    }
    resolutionStrategy {
        eachPlugin {
            if (requested.id.id == "org.jetbrains.kotlin.android") {
                useVersion("2.3.0")
            }
        }
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "onyx-android"
include(":app")