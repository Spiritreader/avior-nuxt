pipeline {
  environment {
    registry = 'spiritreader/avior-nuxt'
    registryCredentials = 'avior-nuxt-dh-login'
    dockerImage = ''
  }
  agent {
    label 'master'
  }
  stages {
    stage('Build') {
      steps {
        script {
          dockerImage = docker.build(registry + ":${BUILD_ID}",
                                     "--build-arg=COMMIT=${GIT_COMMIT}"
                                     + ' .')
        }
      }
    }
    stage('Publish') {
      steps {
          script {
            docker.withRegistry('', registryCredentials) {
              dockerImage.push("latest")
            }
          }
      }
    }
    stage('CleanUp') {
      steps {
        sh "docker rmi $registry:$BUILD_ID"
      }
    }
  }
}
