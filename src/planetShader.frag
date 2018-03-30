uniform float time;

#define TWO_PI  6.2831853
#define PI      3.1415926
#define HALF_PI 1.5707963
#define DEG_RAD 0.0174532

// 0.8 - 1.0 seem to work well
uniform float antialias;// 0.95

// speed at which the planet spins
uniform float planetRotationSpeed;// 0.1


// radius scale of the planet. values greater than 1.8 will cause clipping
uniform float planetSize;// 1.0

// width of aura. values around 0.3 seem to look nice
uniform float auraSize;// .3

uniform sampler2D planetTexture; 
uniform sampler2D nightTexture; 
uniform sampler2D normalTexture; 
uniform sampler2D specTexture; 

// position of light, where 0,0,0 is center of planet.
// x is to the right, y is down, z is forward
uniform vec3 lightPos;
// color of light [r, g, b], values between 0.0 - 1.0
uniform vec3 lightColor;
// color of aura [r, g, b]. values between 0.0 - 1.0. best if close to light color
uniform vec3 auraColor;
// ambient lighting, used to illuminate areas that the light doesn't hit
uniform vec3 ambientLightColor;

// rotation of the planet axis
uniform mat3 rotation;

varying vec2 v_texCoords;

void main(){

    vec2 pos =  (v_texCoords - 0.5) * 3.0;
    float d = pos.x * pos.x + pos.y * pos.y;

    if(d > 1.){
        discard;
    }

    float z = sqrt(1.0 - d);

    // get light and aura intensity
    vec3 point = vec3(pos.xy, z);
    // axis rotate
    vec3 rotPoint = point * rotation;

    float y = (asin(rotPoint.y) + HALF_PI) / PI;
    float x = (atan(rotPoint.x, rotPoint.z) + PI) / TWO_PI;
    // spin over time
    x = mod(x+planetRotationSpeed * time, 1.);

    vec2 uv = vec2(x, y);

    #ifdef USE_NORMAL
    vec3 normal = normalize(((texture2D(normalTexture, uv).xyz * 2.) - 1.) * vec3(0.1, 0.1, 1));
    normal.z = clamp(normal.z, 0., 1.);
    vec3 bitangent = -cross(point, vec3(1.0, 0., 0.));
    vec3 tangent = cross(bitangent, point);
    //manually transposed
    mat3 tbn = mat3(
        tangent.x, bitangent.x, point.x,
        tangent.y, bitangent.y, point.y, 
        tangent.z, bitangent.z, point.z);

    normal *= tbn;
    #else
    vec3 normal = point;
    #endif

    float lightIntensity = clamp(dot(normal, normalize(lightPos)), 0.0, 1.0);
    vec3 light = lightIntensity * lightColor + (1. - lightIntensity) * ambientLightColor;

    vec4 texel = texture2D(planetTexture, uv);

    #ifdef USE_SPEC
    vec3 specIntensity = texture2D(specTexture, uv).xyz;
    float specLight = pow(lightIntensity, 16.) * lightIntensity;
    texel += vec4(specLight * specIntensity, 1.);
    #endif

    #ifdef USE_NIGHT
    float invLight = clamp(.8 - lightIntensity, 0., 1.);
    texel *= vec4(light, 1.) + texture2D(nightTexture, uv) * (invLight * invLight * invLight);
    #endif

    // feathering
    vec4 aaTex = texel * (1.0 - smoothstep(antialias, 1.0, d));
    gl_FragColor = aaTex;
}