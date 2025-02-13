{% if assumptions -%}
# SIMPROV:Assumptions = {{ assumptions }}
{%- endif %}
{% if requirements -%}
# SIMPROV:Requirements = {{ requirements }}
{%- endif %}
{% if model -%}
# SIMPROV:Simulation Model = {{ model }}
{%- endif %}

# NOTE: If you want to capture provenance from a simulation experiment you can use our SimPROV helper library.
# Please checkout this link for more information: https://simprov.readthedocs.io/en/latest/user/utility_library.html