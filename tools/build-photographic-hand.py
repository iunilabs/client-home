"""Run with Blender 4.5: --background --python this_file -- SOURCE_BLEND OUTPUT_DIR.

Source: LibHand hand.blend, Marin Saric / Rizzle Studios, CC BY 3.0.
Keep the photographed UV texture, skin weights and anatomical nail geometry.
"""
import bpy
import bmesh
import json
import math
import pathlib
import sys
from mathutils import Matrix, Vector, Quaternion

args = sys.argv[sys.argv.index('--') + 1:]
source = pathlib.Path(args[0])
output = pathlib.Path(args[1])
output.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(source))
arm = bpy.data.objects['Armature']
hand = bpy.data.objects['hand_mesh']
arm.animation_data_clear()
for bone in arm.pose.bones:
    bone.matrix_basis.identity()
bpy.context.view_layer.update()

# Open the fingers before baking the neutral pose. The original scientific
# model uses a flexed reference pose. Retain the thumb's anatomical splay.
for finger in range(1, 5):
    first = arm.pose.bones[f'finger{finger}joint1']
    direction = first.tail - first.head
    direction.z = 0
    direction.normalize()
    for joint in range(1, 4):
        bone = arm.pose.bones[f'finger{finger}joint{joint}']
        bpy.context.view_layer.update()
        rotation = (bone.tail - bone.head).normalized().rotation_difference(direction)
        bone.matrix = Matrix.Translation(bone.head) @ rotation.to_matrix().to_4x4() @ bone.matrix.to_3x3().to_4x4()
        bpy.context.view_layer.update()

depsgraph = bpy.context.evaluated_depsgraph_get()
evaluated = hand.evaluated_get(depsgraph).to_mesh()
neutral_vertices = [v.co.copy() for v in evaluated.vertices]
hand.evaluated_get(depsgraph).to_mesh_clear()
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
bpy.ops.pose.armature_apply(selected=False)
bpy.ops.object.mode_set(mode='OBJECT')
for vertex, coordinate in zip(hand.data.vertices, neutral_vertices):
    vertex.co = coordinate

# Normalise to metres. In the GLB, fingers point along +X, thumb towards +Y
# and the palm faces +Z, matching the existing narrative coordinate system.
wrist = arm.data.bones['metacarpals'].head_local.copy()
scale = .0455
transform = Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Rotation(math.pi, 4, 'Y') @ Matrix.Scale(scale, 4) @ Matrix.Translation(-wrist)
hand.parent = None
hand.matrix_world.identity()
arm.matrix_world.identity()
hand.data.transform(transform)
arm.data.transform(transform)
hand.parent = arm
hand.matrix_parent_inverse.identity()
for attribute in list(hand.data.color_attributes):
    hand.data.color_attributes.remove(attribute)

# Continue the photographed wrist into a forearm. Reuse the boundary's UVs
# at the seam; the realtime pore and hair layers retain their physical scale.
bm = bmesh.new()
bm.from_mesh(hand.data)
bmesh.ops.delete(bm, geom=[face for face in bm.faces if face.material_index == 1], context='FACES')
edges = [edge for edge in bm.edges if edge.is_boundary and all(vertex.co.x < -.025 for vertex in edge.verts)]
assert 80 < len(edges) < 200, 'Unexpected photographed wrist boundary'
verts = list(set(vertex for edge in edges for vertex in edge.verts))
centre = sum((vertex.co for vertex in verts), Vector()) / len(verts)
original = {vertex: vertex.co.copy() for vertex in verts}
uv = bm.loops.layers.uv.active
edge_uv = {edge: {vertex: next(loop[uv].uv.copy() for loop in edge.link_faces[0].loops if loop.vert == vertex) for vertex in edge.verts} for edge in edges}
deform = bm.verts.layers.deform.active
carpals = hand.vertex_groups.find('carpals')
previous = {vertex: vertex for vertex in verts}
for ring in range(1, 33):
    t = ring / 32
    growth = 1 + .62 * math.sin(t * math.pi * .68) ** 1.5
    following = {}
    for vertex in verts:
        base = original[vertex]
        coordinate = Vector((base.x - .25*t, centre.y+(base.y-centre.y)*growth, centre.z+(base.z-centre.z)*growth))
        new = bm.verts.new(coordinate)
        new[deform][carpals] = 1
        following[vertex] = new
    for edge in edges:
        a, b = edge.verts
        face = bm.faces.new((previous[a], previous[b], following[b], following[a]))
        face.material_index = 0
        for loop, source_vertex, depth in zip(face.loops, (a,b,b,a), ((ring-1)/32,(ring-1)/32,t,t)):
            loop[uv].uv = edge_uv[edge][source_vertex] + Vector((-.018 * math.sin(depth*math.pi/2), 0))
    previous = following
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
bm.to_mesh(hand.data)
bm.free()
hand.data.validate()
for polygon in hand.data.polygons:
    polygon.use_smooth = True

texture = bpy.data.images['hand_texture_image']
texture.filepath = str(source.parent / 'hand_texture.png')
texture.reload()
texture.pack()
atlas = output.parent / 'textures' / 'mano' / 'skin-atlas-v3.png'
if atlas.exists():
    texture = bpy.data.images.load(str(atlas))
    texture.name = 'Detailed skin albedo — Puntoes imagegen adaptation'
    texture.pack()
forearm = output.parent / 'textures' / 'mano' / 'forearm-albedo-v1.png'
if forearm.exists():
    arm_texture = bpy.data.images.load(str(forearm))
    arm_texture.name = 'Forearm albedo — Puntoes imagegen'
    arm_texture.use_fake_user = True
    arm_texture.pack()
material = bpy.data.materials.new('Photographed human skin — LibHand')
material.use_nodes = True
nodes = material.node_tree.nodes
bsdf = nodes.get('Principled BSDF')
image = nodes.new('ShaderNodeTexImage')
image.image = texture
material.node_tree.links.new(image.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = .47
bsdf.inputs['IOR'].default_value = 1.4
bsdf.inputs['Specular IOR Level'].default_value = .35
bsdf.inputs['Subsurface Weight'].default_value = .12
hand.data.materials[0] = material
hand.name = 'human-photo-skin'
arm.name = 'human-photo-rig'

for obj in list(bpy.data.objects):
    if obj not in (hand, arm):
        bpy.data.objects.remove(obj, do_unlink=True)
hand.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = hand
bpy.context.view_layer.update()

metadata = {'source': 'LibHand', 'author': 'Marin Saric / Rizzle Studios', 'license': 'CC BY 3.0', 'units': 'metres', 'nailBeds': 5,
            'fingerRoles': {'thumb':5,'index':4,'middle':3,'ring':2,'pinky':1},
            'bones': {bone.name: {'head': list(bone.head_local), 'tail': list(bone.tail_local)} for bone in arm.data.bones}}
# Metadata uses glTF axes too, because Blender's exporter changes Z-up to Y-up.
axis = Matrix.Rotation(-math.pi / 2, 4, 'X')
for bone in metadata['bones'].values():
    for key in ('head', 'tail'):
        bone[key] = list(axis @ Vector(bone[key]))
(output / 'human-photo-rig.json').write_text(json.dumps(metadata, indent=2))
editable = output.parent.parent / 'art' / 'mano'
editable.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(editable / 'human-photo.blend'))
bpy.ops.export_scene.gltf(filepath=str(output / 'human-photo.glb'), export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_yup=True)

decimate = hand.modifiers.new('Narrative camera mesh', 'DECIMATE')
decimate.ratio = .42
bpy.context.view_layer.objects.active = hand
bpy.ops.object.modifier_move_up(modifier=decimate.name)
bpy.ops.object.modifier_apply(modifier=decimate.name)
bpy.ops.export_scene.gltf(filepath=str(output / 'human-photo-web.glb'), export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_yup=True)
print('HAND_EXPORT_COMPLETE', str(output))
