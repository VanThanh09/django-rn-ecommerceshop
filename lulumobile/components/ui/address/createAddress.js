import { View, Text, StyleSheet, Pressable, FlatList, ScrollView, SectionList, TouchableWithoutFeedback, Keyboard, ActivityIndicator, DeviceEventEmitter } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useState, useRef, useEffect } from 'react'
import { Searchbar } from 'react-native-paper'
import ModalMsg from '../../utils/modalMsg';
import Apis, { endpoints } from '../../../configs/Apis';
import { useNavigation } from '@react-navigation/native';

const Item = ({ item, checked, handleOnPress }) => {
    return (
        <View style={styles.item}>
            <Pressable onPress={handleOnPress} style={itemStyles.btnItem}>
                <Text style={checked && { color: "#fa5230" }}>{item.name}</Text>
                {checked && <Icon name="check" size={24} color="#fa5230" />}
            </Pressable>
        </View>
    )
}



const itemStyles = StyleSheet.create({
    btnItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    }
})

const CITY = 1
const DISTRICT = 2
const WARD = 3

const CreateAddress = () => {
    const [data, setData] = useState(null)
    const [selected, setSelected] = useState(CITY)
    const [address, setAddress] = useState({ "0": { id: "0", name: "undefined" } })
    // 0 : 0 (de tim kiem th)) "1" : city, 2: "district", 3: "ward"

    const titleForSelected = useRef(["Tỉnh/Thành phố", "Quận/Huyện", "Phường/Xã"]).current
    const [groupedData, setGroupedData] = useState(null);
    const [searchText, setSearchText] = useState('')
    const [useSearch, setUseSearch] = useState(false)
    const [searchData, setSearchData] = useState([])
    const [loading, setLoading] = useState(false)
    const [openModalMsg, setOpenModalMsg] = useState(false)
    const navigation = useNavigation()

    const fitlerDataName = (text) => {
        if (text === '')
            setSearchData([])
        else
            setSearchData(data.filter(item => item.full_name.toLowerCase().includes(text.trim().toLowerCase())
                || item.full_name_en.toLowerCase().includes(text.trim().toLowerCase())))
    }

    const handleSelect = (value) => {
        console.log("check for ", value)
        if (!((value - 1).toString() in address)) {
            setOpenModalMsg(true)
        }
        else {
            setSelected(value)
        }
    }

    const handleOntextChange = (newText) => {
        setSearchText(newText)
        fitlerDataName(newText)
    }

    const handleRest = () => {
        setAddress({"0": { id: "0", name: "undefined" } })
        setSelected(1)
    }

    const getDataLocation = async (A, B) => {
        try {
            let res = await Apis.get(endpoints['getLocationOfVietNam'](A, B))
            //console.log("this is VIET NAM ", res.data.data)
            setData(res.data.data)
        }
        catch (err) {
            console.log("Fail to get data location ", err)
            throw err
        }
    }

    const isCheckItem = (index, name) => {
        return address[index]?.name === name
    }

    const handleOnpressItem = (index, name, id) => {
        setAddress({ ...address, [index]: { id, name } })
        console.log("address right now: ", { ...address, [index]: { id, name } })

        if (index === WARD) {
            // Xử lý quay về lại trang lúc nãy và emit event .... (Đã chọn xong hết)
            // Clean dữ liệu về dạng {1: "CITY", 2: ...}
            const currentAddress = { ...address, [index]: { id, name } }
            const finalAddress = Object.keys(currentAddress).reduce((acc, index) => {
                if (index != "0") {
                    acc[index] = currentAddress[index].name
                }
                return acc
            }, {})
            console.log("final addreess ", finalAddress)
            DeviceEventEmitter.emit("event.selectedCityDistrictWard", finalAddress)
            navigation.goBack()
        }
        else {
            // Tăng selected tiếp tục chọn khu vực cấp thấp hơn
            setSelected(selected+1)
        }
    }

    useEffect(() => {
        try {
            setLoading(true)
            console.log(selected, Number(address[selected - 1].id))
         //   getDataLocation(selected, Number(address[selected - 1].id))
            getDataLocation(selected, address[selected - 1].id)
            
        }
        catch (err) {
            console.log("Fail to get data location ", err)
        }
        finally {
            setLoading(false)
        }

        return () => {
            setGroupedData(null)
            setUseSearch(false); 
            setSearchText(''); 
            setSearchData([]) ;
        }
    }, [selected])

    useEffect(() => {
        if (data != null) {
            setGroupedData(Object.values(
                data.reduce((acc, item) => {
                    const firstLetter = item.name_en[0].toUpperCase();
                    if (!acc[firstLetter]) {
                        acc[firstLetter] = {
                            title: firstLetter,
                            data: [],
                        };
                    }
                    acc[firstLetter].data.push(item);
                    return acc;
                }, {})
            ).sort((a, b) => a.title.localeCompare(b.title)))
        }
    }, [data])


    if (loading || groupedData === null) {
        return (<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={"#fa5230"} />
        </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", }}>
                    <Text style={{ color: "#3d3d3d" }}>Khu vực được chọn</Text>
                    <Pressable onPress={handleRest}>
                        <Text style={{ color: "#fa5230" }}>Thiết lập lại</Text>
                    </Pressable>
                </View>

                <View style={styles.city(selected)}>
                    <Pressable onPress={() => handleSelect(CITY)}>
                        <Text style={selected == CITY && { color: "#fa5230" }}>{address[CITY] ? address[CITY].name : "Chọn tỉnh/thành phố"}</Text>
                    </Pressable>
                </View>

                <View style={styles.district(selected)}>
                    <Pressable onPress={() => handleSelect(DISTRICT)}>
                        <Text style={selected == DISTRICT && { color: "#fa5230" }}>{address[DISTRICT] ? address[DISTRICT].name : "Chọn quận/huyện"}</Text>
                    </Pressable>
                </View>

                <View style={styles.ward(selected)}>
                    <Pressable onPress={() => handleSelect(WARD)}>
                        <Text style={selected == WARD && { color: "#fa5230" }}>{address[WARD] ? address[WARD].name : "Chọn phường/xã"}</Text>
                    </Pressable>
                </View>
            </View>
            <View style={{ paddingHorizontal: 12, paddingVertical: 12 }}>
                <Text>{titleForSelected[Number(selected - 1)]}</Text>
                <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8}}>
                    <Searchbar
                        placeholder={`Tìm kiếm ${titleForSelected[Number(selected - 1)]}`}
                        onChangeText={handleOntextChange}
                        value={searchText}
                        style={styles.searchBar}
                        inputStyle={{ color: '#000' }} // Màu chữ
                        onFocus={() => { setUseSearch(true); console.log("forcus") }}
                        //onBlur={() => { setUseSearch(false); console.log("blur") }}
                    />
                    <Pressable onPress={() => { setUseSearch(false); setSearchText(''); setSearchData([]) ;Keyboard.dismiss()}}>
                        <Text style={{color: "#fa5230", fontSize: 16}}>Thoát</Text>
                    </Pressable>
                </View>

            </View>
            <View style={styles.dataContainer}>
                {
                    useSearch == true ? (
                        <FlatList
                            data={searchData}
                            renderItem={({ item }) => <Item item={item}
                                handleOnPress={() => { handleOnpressItem(selected, item.full_name, item.id) }}
                                checked={isCheckItem(selected, item.full_name)} />}
                            keyExtractor={(item) => item.id}
                        />
                    ) : (<SectionList
                        sections={groupedData}
                        stickySectionHeadersEnabled={false} // Disable if not needed
                        initialNumToRender={20} // Render only 20 items initially
                        maxToRenderPerBatch={10} // Items to render per batch
                        windowSize={10} // Reduce offscreen items
                        removeClippedSubviews={true} // Android optimization
                        keyExtractor={(item, index) => item.id + index}
                        renderItem={({ item }) => (
                            <Item item={item} handleOnPress={() => { handleOnpressItem(selected, item.full_name, item.id) }} checked={isCheckItem(selected, item.full_name)}></Item>
                        )}
                        renderSectionHeader={({ section: { title } }) => (
                            <View style={styles.headerSection}>
                                <Text style={styles.headerSectionText}>{title}</Text>
                            </View>
                        )}
                    />)
                }
            </View>
            <ModalMsg visible={openModalMsg} message={"Vui lòng chọn theo thứ tự tỉnh/thành phố, quận/huyện, phường/xã"}
                handleCloseModalMsg={() => setOpenModalMsg(false)}
                handleOnpressConfirm={() => setOpenModalMsg(false)}
                showBtnNo={false} />
        </View>
    )
}

export default CreateAddress

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    headerContainer: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: "white",
    },
    city: (selected) => ({
        paddingHorizontal: 16,
        paddingVertical: 18,
        marginTop: 8,
        borderColor: selected == CITY ? "#fa5230" : "#fff",
        borderWidth: selected == CITY ? 1 : 0,
    }),
    district: (selected) => ({
        paddingHorizontal: 16,
        paddingVertical: 18,
        borderColor: selected == DISTRICT ? "#fa5230" : "#fff",
        borderWidth: selected == DISTRICT ? 1 : 0,
    }),
    ward: (selected) => ({
        paddingHorizontal: 16,
        paddingVertical: 18,
        borderColor: selected == WARD ? "#fa5230" : "#fff",
        borderWidth: selected == WARD ? 1 : 0,
    }),
    dataContainer: {
        backgroundColor: "white",
        paddingBottom: 30,
        flex: 1,
        marginTop: 5
    },
    headerSection: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    headerSectionText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#999',
    },
    item: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    searchBar: {
        backgroundColor: '#fff', // Màu nền
        borderRadius: 8,
        elevation: 2,
        shadowOpacity: 0.1,
        marginTop: 8,
        flex: 1
    },
    searchData: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    }
})