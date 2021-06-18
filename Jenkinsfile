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
          dockerImage = docker.build(registry + ":${GIT_LOCAL_BRANCH}-${BUILD_ID}",
                                     "--build-arg=COMMIT=${GIT_COMMIT}"
                                     + ' .')
        }
      }
    }
    stage('Publish') {
      steps {
        script {
          if (env.GIT_LOCAL_BRANCH == 'master') {
            sh "echo 'prod environment, pushing to latest'"
            docker.withRegistry('', registryCredentials) {
              dockerImage.push('latest')
            }
        }
          else {
            sh "echo 'dev environment, pushing to $GIT_LOCAL_BRANCH-$BUILD_ID-'"
            docker.withRegistry('', registryCredentials) {
              dockerImage.push('${GIT_LOCAL_BRANCH}-${BUILD_ID}')
            }
          }
      }
    }
  }
    stage('CleanUp') {
      steps {
        sh "docker rmi $registry:$GIT_LOCAL_BRANCH-$BUILD_ID"
      }
    }
  }
}
