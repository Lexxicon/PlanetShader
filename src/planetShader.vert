uniform float time;

varying vec2 v_texCoords;

void main() {
    v_texCoords = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}