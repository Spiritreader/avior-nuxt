pipeline {
  environment {
    registry = 'spiritreader/avior-nuxt'
    registryCredentials = 'avior-nuxt-dh-login'
    dockerImage = ''
    defaultBranch = 'master'
  }
  agent {
    label 'master'
  }
  stages {
    stage('Build') {
      steps {
        script {
          dockerImage = docker.build(registry + ":${BUILD_ID}-${GIT_LOCAL_BRANCH}",
                                     "--build-arg=COMMIT=${GIT_COMMIT}"
                                     + ' .')
        }
      }
    }
    stage('Publish') {
      when { branch defaultBranch }
      steps {
          script {
            docker.withRegistry('', registryCredentials) {
              dockerImage.push('latest')
            }
          }
      }
    }
    stage('Publish Dev') {
      when {
        not {
          branch defaultBranch
        }
      }
      steps {
          script {
            docker.withRegistry('', registryCredentials) {
              dockerImage.push()
            }
          }
      }
    }
    stage('CleanUp') {
      steps {
        sh "docker rmi $registry:$BUILD_ID-$GIT_LOCAL_BRANCH"
      }
    }
  }
}
